/**
 * Firebase Admin SDK configuration for FCM push notifications.
 *
 * Environment variables required:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY (base64 encoded or raw with \n)
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getMessaging, Messaging } from "firebase-admin/messaging";

// ponytail: lazy init — avoids crashing next build when env vars aren't available
function getFirebaseApp(): App | null {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "[firebase-admin] Missing Firebase credentials. Push notifications disabled."
    );
    return null;
  }

  // Handle escaped newlines in environment variable
  if (privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export function getMessagingInstance(): Messaging | null {
  const app = getFirebaseApp();
  return app ? getMessaging(app) : null;
}

export function isFirebaseConfigured(): boolean {
  return getMessagingInstance() !== null;
}
