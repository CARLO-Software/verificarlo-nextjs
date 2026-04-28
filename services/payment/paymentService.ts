// ============================================================================
// PAYMENT SERVICE
// Lógica de negocio para procesar eventos de pago de Culqi.
// Este módulo es invocado por el webhook handler y NO por el frontend.
//
// EVENTOS SOPORTADOS:
//   - charge.creation.succeeded (cargo creado)
//   - charge.succeeded / charge.update.succeeded (cargo exitoso)
//   - charge.failed / charge.update.failed (cargo fallido)
//   - order.creation.succeeded (orden creada)
//   - order.status.changed (orden cambió de estado)
// ============================================================================

import { db } from "@/lib/db";
import { assignInspector } from "@/lib/scheduling/inspector-assignment";
import { createVehicleInspection } from "@/lib/vehicle-inspection/create-inspection";
import { sendPaymentConfirmationEmail } from "@/lib/email/sendPaymentConfirmation";

// ============================================================================
// TIPOS — Culqi Webhook Event
// ============================================================================

export interface CulqiChargeSource {
  object: string; // "card" | "token" (Yape)
  card_number?: string;
  card_brand?: string;
  iin?: {
    card_type?: string;
    card_brand?: string;
  };
}

export interface CulqiChargeOutcome {
  type: string;
  code: string;
  merchant_message: string;
  user_message: string;
}

export interface CulqiChargeData {
  id: string; // chr_xxx
  amount: number; // en céntimos (ej: 15000 = S/150.00)
  currency_code: string;
  email: string;
  description: string;
  metadata: {
    bookingId: string;
    inspectionType?: string;
    vehiclePlate?: string;
    [key: string]: string | undefined;
  };
  outcome?: CulqiChargeOutcome;
  source?: CulqiChargeSource;
  failure_code?: string;
  failure_message?: string;
}

export interface CulqiOrderData {
  id: string; // ord_xxx
  amount: number;
  currency_code: string;
  state: "pending" | "paid" | "expired" | "deleted";
  metadata: {
    bookingId: string;
    [key: string]: string | undefined;
  };
  charges?: CulqiChargeData[];
}

export interface CulqiWebhookEvent {
  id: string; // evt_xxx — unique per event, used for idempotency
  type: string;
  created_at: number;
  data: CulqiChargeData | CulqiOrderData;
}

// ============================================================================
// HELPER — Type Guards
// ============================================================================

function isChargeData(data: CulqiChargeData | CulqiOrderData): data is CulqiChargeData {
  return data.id.startsWith("chr_");
}

function isOrderData(data: CulqiChargeData | CulqiOrderData): data is CulqiOrderData {
  return data.id.startsWith("ord_");
}

// ============================================================================
// HELPER — Resolve human-readable payment method from Culqi source
// ============================================================================

function resolvePaymentMethodLabel(source?: CulqiChargeSource): string {
  if (!source) return "Culqi";
  if (source.object === "token") return "Yape";
  const brand = source.iin?.card_brand ?? source.card_brand;
  if (brand) return brand;
  return "Tarjeta";
}

// ============================================================================
// HELPER — Log webhook event to database
// ============================================================================

export async function logWebhookEvent(
  event: CulqiWebhookEvent,
  status: "RECEIVED" | "PROCESSING" | "PROCESSED" | "FAILED" | "SKIPPED",
  options?: {
    chargeId?: string;
    orderId?: string;
    bookingId?: number;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  try {
    const data = event.data;
    const chargeId = options?.chargeId ?? (isChargeData(data) ? data.id : undefined);
    const orderId = options?.orderId ?? (isOrderData(data) ? data.id : undefined);
    const bookingId = options?.bookingId ??
      (data.metadata?.bookingId ? parseInt(data.metadata.bookingId, 10) : undefined);

    await db.webhookEvent.upsert({
      where: { eventId: event.id },
      create: {
        eventId: event.id,
        eventType: event.type,
        chargeId,
        orderId,
        bookingId: isNaN(bookingId as number) ? null : bookingId,
        rawPayload: event as object,
        status,
        errorMessage: options?.errorMessage,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        processedAt: status === "PROCESSED" ? new Date() : null,
      },
      update: {
        status,
        errorMessage: options?.errorMessage,
        processedAt: status === "PROCESSED" ? new Date() : undefined,
        retryCount: { increment: status === "FAILED" ? 1 : 0 },
      },
    });
  } catch (err) {
    // Non-blocking: log errors but don't fail the webhook
    console.error("[PaymentService] Failed to log webhook event:", err);
  }
}

// ============================================================================
// HELPER — Post-payment actions (inspector assignment, vehicle inspection)
// ============================================================================

async function executePostPaymentActions(bookingId: number): Promise<void> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      client: { select: { id: true, name: true } },
      vehicle: {
        include: { model: { include: { brand: true } } },
      },
    },
  });

  if (!booking) {
    console.error(`[PaymentService] Booking ${bookingId} not found for post-payment actions`);
    return;
  }

  // 1. Assign inspector
  const assignment = await assignInspector(bookingId);
  if (!assignment.success) {
    console.error(
      `[PaymentService] Inspector assignment failed for booking ${bookingId}: ${assignment.error}`
    );
  }

  // 2. Create VehicleInspection (dual flow: mechanic + legal)
  const vehicleDescription = `${booking.vehicle.model.brand.name} ${booking.vehicle.model.name} ${booking.vehicle.year}`;
  const vehicleInspectionResult = await createVehicleInspection({
    bookingId,
    vehicleId: booking.vehicle.id,
    clientId: booking.client.id,
    plate: booking.vehicle.plate,
    vehicleDescription,
    clientName: booking.client.name || "Cliente",
  });

  if (!vehicleInspectionResult.success) {
    console.error(
      `[PaymentService] VehicleInspection creation failed for booking ${bookingId}: ${vehicleInspectionResult.error}`
    );
  }
}

// ============================================================================
// HANDLER — charge.creation.succeeded
// Cargo creado pero aún no procesado. Solo logging.
// ============================================================================

export async function handleChargeCreationSucceeded(
  event: CulqiWebhookEvent
): Promise<void> {
  const charge = event.data as CulqiChargeData;

  console.log(
    `[PaymentService] charge.creation.succeeded — charge ${charge.id} created`
  );

  await logWebhookEvent(event, "PROCESSED");
}

// ============================================================================
// HANDLER — charge.succeeded / charge.update.succeeded
// ============================================================================

export async function handleChargeSucceeded(
  event: CulqiWebhookEvent
): Promise<void> {
  const charge = event.data as CulqiChargeData;
  const bookingId = parseInt(charge.metadata.bookingId, 10);

  if (isNaN(bookingId)) {
    await logWebhookEvent(event, "FAILED", {
      errorMessage: `Invalid bookingId in metadata: "${charge.metadata.bookingId}"`,
    });
    throw new Error(`Invalid bookingId in metadata: "${charge.metadata.bookingId}"`);
  }

  await logWebhookEvent(event, "PROCESSING", { bookingId });

  // ── Idempotency check ──────────────────────────────────────────────────────
  // Two guards: event ID (webhook dedup) + charge ID (charge dedup)
  const existing = await db.payment.findFirst({
    where: {
      OR: [
        { culqiEventId: event.id },
        { culqiChargeId: charge.id },
      ],
    },
    select: { id: true, status: true },
  });

  if (existing?.status === "COMPLETED") {
    console.log(
      `[PaymentService] Duplicate event skipped: ${event.id} (charge ${charge.id})`
    );
    await logWebhookEvent(event, "SKIPPED", { bookingId });
    return;
  }

  // ── Fetch booking ──────────────────────────────────────────────────────────
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: { select: { id: true, status: true } },
      client: { select: { id: true, email: true, name: true } },
      inspectionPlan: { select: { title: true, type: true } },
      vehicle: {
        include: { model: { include: { brand: true } } },
      },
    },
  });

  if (!booking) {
    await logWebhookEvent(event, "FAILED", {
      bookingId,
      errorMessage: `Booking ${bookingId} not found`,
    });
    throw new Error(`Booking ${bookingId} not found`);
  }
  if (!booking.payment) {
    await logWebhookEvent(event, "FAILED", {
      bookingId,
      errorMessage: `No payment record for booking ${bookingId}`,
    });
    throw new Error(`No payment record for booking ${bookingId}`);
  }

  // Guard: already in a terminal state (e.g. admin already marked it)
  if (
    booking.status === "PAID" ||
    booking.status === "COMPLETED" ||
    booking.payment.status === "COMPLETED"
  ) {
    console.log(
      `[PaymentService] Booking ${bookingId} already in terminal state — skipping`
    );
    await logWebhookEvent(event, "SKIPPED", { bookingId });
    return;
  }

  // ── Atomic DB update ───────────────────────────────────────────────────────
  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: booking.payment!.id },
      data: {
        status: "COMPLETED",
        culqiChargeId: charge.id,
        culqiEventId: event.id,
        paidAt: new Date(),
        metadata: charge as object,
      },
    });

    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "PAID",
        expiresAt: null,
      },
    });
  });

  // ── Post-payment actions (non-blocking) ────────────────────────────────────
  try {
    await executePostPaymentActions(bookingId);
  } catch (err) {
    console.error(`[PaymentService] Post-payment actions failed for booking ${bookingId}:`, err);
  }

  // ── Email confirmation (non-blocking) ─────────────────────────────────────
  try {
    await sendPaymentConfirmationEmail({
      to: booking.client.email,
      clientName: booking.client.name,
      bookingId: booking.id,
      amount: charge.amount / 100,
      paymentMethod: resolvePaymentMethodLabel(charge.source),
      chargeId: charge.id,
      planTitle: booking.inspectionPlan.title,
      vehicleLabel: `${booking.vehicle.model.brand.name} ${booking.vehicle.model.name} ${booking.vehicle.year}`,
    });
  } catch (emailErr) {
    console.error(
      `[PaymentService] Email failed for booking ${bookingId}:`,
      emailErr
    );
  }

  await logWebhookEvent(event, "PROCESSED", { bookingId });

  console.log(
    `[PaymentService] ✓ charge.succeeded — booking ${bookingId} → PAID`
  );
}

// ============================================================================
// HANDLER — charge.failed / charge.update.failed
// ============================================================================

export async function handleChargeFailed(
  event: CulqiWebhookEvent
): Promise<void> {
  const charge = event.data as CulqiChargeData;
  const bookingId = parseInt(charge.metadata.bookingId, 10);

  if (isNaN(bookingId)) {
    await logWebhookEvent(event, "FAILED", {
      errorMessage: `Invalid bookingId in metadata: "${charge.metadata.bookingId}"`,
    });
    throw new Error(`Invalid bookingId in metadata: "${charge.metadata.bookingId}"`);
  }

  await logWebhookEvent(event, "PROCESSING", { bookingId });

  // ── Idempotency ────────────────────────────────────────────────────────────
  const existing = await db.payment.findFirst({
    where: { culqiEventId: event.id },
    select: { id: true, status: true },
  });

  if (existing?.status === "FAILED") {
    console.log(`[PaymentService] Duplicate failure event skipped: ${event.id}`);
    await logWebhookEvent(event, "SKIPPED", { bookingId });
    return;
  }

  // ── Fetch booking ──────────────────────────────────────────────────────────
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: { select: { id: true, status: true } },
    },
  });

  if (!booking?.payment) {
    await logWebhookEvent(event, "FAILED", {
      bookingId,
      errorMessage: `No payment found for booking ${bookingId}`,
    });
    throw new Error(`No payment found for booking ${bookingId}`);
  }

  // ── Update payment to FAILED ───────────────────────────────────────────────
  // The booking status intentionally stays PENDING_PAYMENT so the user can retry.
  await db.payment.update({
    where: { id: booking.payment.id },
    data: {
      status: "FAILED",
      culqiChargeId: charge.id,
      culqiEventId: event.id,
      errorCode: charge.failure_code ?? charge.outcome?.code,
      errorMessage:
        charge.failure_message ?? charge.outcome?.user_message ?? "Pago rechazado",
      metadata: charge as object,
    },
  });

  await logWebhookEvent(event, "PROCESSED", { bookingId });

  console.log(
    `[PaymentService] ✗ charge.failed — booking ${bookingId}, code: ${
      charge.failure_code ?? charge.outcome?.code ?? "unknown"
    }`
  );
}

// ============================================================================
// HANDLER — order.creation.succeeded
// Orden creada. Guardamos el orderId para tracking.
// ============================================================================

export async function handleOrderCreationSucceeded(
  event: CulqiWebhookEvent
): Promise<void> {
  const order = event.data as CulqiOrderData;
  const bookingId = parseInt(order.metadata.bookingId, 10);

  if (isNaN(bookingId)) {
    await logWebhookEvent(event, "FAILED", {
      orderId: order.id,
      errorMessage: `Invalid bookingId in metadata: "${order.metadata.bookingId}"`,
    });
    throw new Error(`Invalid bookingId in metadata: "${order.metadata.bookingId}"`);
  }

  await logWebhookEvent(event, "PROCESSING", { bookingId, orderId: order.id });

  // Update payment with order ID
  const payment = await db.payment.findFirst({
    where: { bookingId },
    select: { id: true, culqiOrderId: true },
  });

  if (payment && !payment.culqiOrderId) {
    await db.payment.update({
      where: { id: payment.id },
      data: { culqiOrderId: order.id },
    });
  }

  await logWebhookEvent(event, "PROCESSED", { bookingId, orderId: order.id });

  console.log(
    `[PaymentService] ✓ order.creation.succeeded — order ${order.id} for booking ${bookingId}`
  );
}

// ============================================================================
// HANDLER — order.status.changed
// Estado de la orden cambió. Procesamos según el nuevo estado.
// ============================================================================

export async function handleOrderStatusChanged(
  event: CulqiWebhookEvent
): Promise<void> {
  const order = event.data as CulqiOrderData;
  const bookingId = parseInt(order.metadata.bookingId, 10);

  if (isNaN(bookingId)) {
    await logWebhookEvent(event, "FAILED", {
      orderId: order.id,
      errorMessage: `Invalid bookingId in metadata: "${order.metadata.bookingId}"`,
    });
    throw new Error(`Invalid bookingId in metadata: "${order.metadata.bookingId}"`);
  }

  await logWebhookEvent(event, "PROCESSING", { bookingId, orderId: order.id });

  console.log(
    `[PaymentService] order.status.changed — order ${order.id} → ${order.state}`
  );

  switch (order.state) {
    case "paid": {
      // Order paid - process like a successful charge
      const charge = order.charges?.[0];
      if (charge) {
        // Reuse charge succeeded logic
        const chargeEvent: CulqiWebhookEvent = {
          id: `${event.id}_charge`,
          type: "charge.succeeded",
          created_at: event.created_at,
          data: {
            ...charge,
            metadata: order.metadata as CulqiChargeData["metadata"],
          },
        };
        await handleChargeSucceeded(chargeEvent);
      } else {
        // No charge details, update directly
        await db.$transaction(async (tx) => {
          await tx.payment.updateMany({
            where: { bookingId },
            data: {
              status: "COMPLETED",
              culqiOrderId: order.id,
              culqiEventId: event.id,
              paidAt: new Date(),
              metadata: order as object,
            },
          });

          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: "PAID",
              expiresAt: null,
            },
          });
        });

        await executePostPaymentActions(bookingId);
      }
      break;
    }

    case "expired": {
      // Order expired - mark booking as expired
      await db.$transaction(async (tx) => {
        await tx.payment.updateMany({
          where: { bookingId },
          data: {
            status: "FAILED",
            culqiOrderId: order.id,
            culqiEventId: event.id,
            errorMessage: "Orden expirada",
          },
        });

        await tx.booking.update({
          where: { id: bookingId },
          data: { status: "EXPIRED" },
        });
      });
      break;
    }

    case "deleted": {
      // Order deleted/cancelled
      console.log(`[PaymentService] Order ${order.id} was deleted`);
      break;
    }

    case "pending":
    default:
      // No action needed for pending
      break;
  }

  await logWebhookEvent(event, "PROCESSED", { bookingId, orderId: order.id });
}
