// ============================================================================
// PAYMENT SERVICE
// Lógica de negocio para procesar eventos de pago de Culqi.
// Este módulo es invocado por el webhook handler y NO por el frontend.
// ============================================================================

import { db } from "@/lib/db";
// import { assignInspector } from "@/lib/scheduling/inspector-assignment"; // TODO: habilitar con Culqi
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
  outcome: CulqiChargeOutcome;
  source: CulqiChargeSource;
  failure_code?: string;
  failure_message?: string;
}

export interface CulqiWebhookEvent {
  id: string; // evt_xxx — unique per event, used for idempotency
  type: "charge.succeeded" | "charge.failed" | string;
  created_at: number;
  data: CulqiChargeData;
}

// ============================================================================
// HELPER — Resolve human-readable payment method from Culqi source
// ============================================================================

function resolvePaymentMethodLabel(source: CulqiChargeSource): string {
  if (source.object === "token") return "Yape";
  const brand = source.iin?.card_brand ?? source.card_brand;
  if (brand) return brand;
  return "Tarjeta";
}

// ============================================================================
// HANDLER — charge.succeeded
// ============================================================================

export async function handleChargeSucceeded(
  event: CulqiWebhookEvent
): Promise<void> {
  const charge = event.data;
  const bookingId = parseInt(charge.metadata.bookingId, 10);

  if (isNaN(bookingId)) {
    throw new Error(`Invalid bookingId in metadata: "${charge.metadata.bookingId}"`);
  }

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
    throw new Error(`Booking ${bookingId} not found`);
  }
  if (!booking.payment) {
    throw new Error(`No payment record for booking ${bookingId}`);
  }

  // Guard: already in a terminal state (e.g. admin already marked it)
  if (
    booking.status === "CONFIRMED" ||
    booking.status === "COMPLETED" ||
    booking.payment.status === "COMPLETED"
  ) {
    console.log(
      `[PaymentService] Booking ${bookingId} already in terminal state — skipping`
    );
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: charge as any,
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

  // ── Inspector auto-assignment ──────────────────────────────────────────────
  // TODO: Habilitar cuando se tengan las API keys de Culqi configuradas.
  // const assignment = await assignInspector(bookingId);
  // if (!assignment.success) {
  //   console.error(
  //     `[PaymentService] Inspector assignment failed for booking ${bookingId}: ${assignment.error}`
  //   );
  // }

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
    // Never let an email failure break the payment confirmation
    console.error(
      `[PaymentService] Email failed for booking ${bookingId}:`,
      emailErr
    );
  }

  console.log(
    `[PaymentService] ✓ charge.succeeded — booking ${bookingId} → PAID/CONFIRMED`
  );
}

// ============================================================================
// HANDLER — charge.failed
// ============================================================================

export async function handleChargeFailed(
  event: CulqiWebhookEvent
): Promise<void> {
  const charge = event.data;
  const bookingId = parseInt(charge.metadata.bookingId, 10);

  if (isNaN(bookingId)) {
    throw new Error(`Invalid bookingId in metadata: "${charge.metadata.bookingId}"`);
  }

  // ── Idempotency ────────────────────────────────────────────────────────────
  const existing = await db.payment.findFirst({
    where: { culqiEventId: event.id },
    select: { id: true, status: true },
  });

  if (existing?.status === "FAILED" && existing !== null) {
    console.log(`[PaymentService] Duplicate failure event skipped: ${event.id}`);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: charge as any,
    },
  });

  console.log(
    `[PaymentService] ✗ charge.failed — booking ${bookingId}, code: ${
      charge.failure_code ?? charge.outcome?.code ?? "unknown"
    }`
  );
}
