/**
 * Push notification service using Firebase Cloud Messaging.
 *
 * Handles sending notifications to mobile devices via FCM tokens
 * stored in the DeviceToken table.
 */

import { db } from "@/lib/db";
import { getMessagingInstance, isFirebaseConfigured } from "@/lib/firebase-admin";

export interface PushPayload {
  type: string;
  inspectionId: number;
  title: string;
  message: string;
  locationUrl?: string;
}

/**
 * Send push notification to a specific user's devices.
 * Automatically cleans up invalid tokens.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!isFirebaseConfigured()) {
    console.warn("[push] Firebase not configured, skipping push notification");
    return { sent: 0, failed: 0 };
  }

  const deviceTokens = await db.deviceToken.findMany({
    where: { userId },
    select: { id: true, token: true },
  });

  if (deviceTokens.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const tokens = deviceTokens.map((d) => d.token);
  const tokenIdMap = new Map(deviceTokens.map((d) => [d.token, d.id]));

  const result = await getMessagingInstance()!.sendEachForMulticast({
    tokens,
    notification: {
      title: payload.title,
      body: payload.message,
    },
    data: {
      type: payload.type,
      inspectionId: String(payload.inspectionId),
      title: payload.title,
      message: payload.message,
      ...(payload.locationUrl && { locationUrl: payload.locationUrl }),
    },
    android: {
      priority: "high",
      notification: {
        channelId: "inspections",
        priority: "high",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
        },
      },
    },
  });

  const invalidTokenIds: string[] = [];

  result.responses.forEach((response: { success: boolean; error?: { code: string } }, idx: number) => {
    if (!response.success && response.error) {
      const errorCode = response.error.code;
      // Remove invalid/expired tokens
      if (
        errorCode === "messaging/invalid-registration-token" ||
        errorCode === "messaging/registration-token-not-registered"
      ) {
        const tokenId = tokenIdMap.get(tokens[idx]);
        if (tokenId) {
          invalidTokenIds.push(tokenId);
        }
      }
    }
  });

  // Clean up invalid tokens
  if (invalidTokenIds.length > 0) {
    await db.deviceToken.deleteMany({
      where: { id: { in: invalidTokenIds } },
    });
    console.log(`[push] Removed ${invalidTokenIds.length} invalid FCM tokens`);
  }

  return {
    sent: result.successCount,
    failed: result.failureCount,
  };
}

/**
 * Send push notification to multiple users (e.g., all admins).
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (userIds.length === 0 || !isFirebaseConfigured()) {
    return { sent: 0, failed: 0 };
  }

  const results = await Promise.all(
    userIds.map((userId) => sendPushToUser(userId, payload))
  );

  return results.reduce(
    (acc, r) => ({
      sent: acc.sent + r.sent,
      failed: acc.failed + r.failed,
    }),
    { sent: 0, failed: 0 }
  );
}

/**
 * Send push notification for new inspection assigned to mechanic.
 */
export async function pushNewInspection(params: {
  mechanicId: string;
  inspectionId: number;
  vehicleDescription: string;
  clientName: string;
}): Promise<void> {
  const { mechanicId, inspectionId, vehicleDescription, clientName } = params;

  await sendPushToUser(mechanicId, {
    type: "new_inspection",
    inspectionId,
    title: "Nueva inspección asignada",
    message: `${vehicleDescription} — Cliente: ${clientName}`,
  }).catch((err) =>
    console.error("[push] Error sending new_inspection push:", err)
  );
}

/**
 * Send push notification when inspection is completed.
 */
export async function pushInspectionCompleted(params: {
  clientId: string;
  inspectionId: number;
  vehicleDescription: string;
}): Promise<void> {
  const { clientId, inspectionId, vehicleDescription } = params;

  await sendPushToUser(clientId, {
    type: "inspection_completed",
    inspectionId,
    title: "Tu inspección está lista",
    message: `La inspección de ${vehicleDescription} fue completada.`,
  }).catch((err) =>
    console.error("[push] Error sending inspection_completed push:", err)
  );
}
