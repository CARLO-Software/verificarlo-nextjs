// ============================================================================
// POST /api/webhooks/culqi
// Recibe y procesa eventos de Culqi (charge.succeeded / charge.failed).
//
// SEGURIDAD:
//   Prioridad 1 — RSA-SHA256: Culqi firma el payload con su clave privada.
//                 Verificamos con la clave pública del dashboard.
//                 Variables: CULQI_RSA_ID, CULQI_RSA_PUBLIC_KEY
//   Prioridad 2 — Bearer token: header Authorization = Bearer {CULQI_SECRET_KEY}
//   Sin config   — Solo en desarrollo (warning en log).
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  handleChargeSucceeded,
  handleChargeFailed,
  CulqiWebhookEvent,
} from "@/services/payment/paymentService";

// ── Env vars ─────────────────────────────────────────────────────────────────

const CULQI_SECRET_KEY = process.env.CULQI_SECRET_KEY ?? "";
const CULQI_RSA_PUBLIC_KEY = process.env.CULQI_RSA_PUBLIC_KEY ?? "";

// ── Signature helpers ─────────────────────────────────────────────────────────

/**
 * Verifica la firma RSA-SHA256 de Culqi.
 * Culqi firma el body JSON con su clave privada RSA.
 * La firma se envía en el header `x-culqi-signature` (base64).
 */
function verifyRsaSignature(
  rawBody: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const verifier = crypto.createVerify("SHA256");
    verifier.update(rawBody, "utf8");
    return verifier.verify(publicKey, signature, "base64");
  } catch (err) {
    console.error("[Webhook] RSA signature verification error:", err);
    return false;
  }
}

/**
 * Verifica que el header Authorization sea `Bearer {CULQI_SECRET_KEY}`.
 * Fallback menos seguro que RSA; válido para Culqi en modo básico.
 */
function verifyBearerToken(authHeader: string | null): boolean {
  if (!authHeader || !CULQI_SECRET_KEY) return false;
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;
  // Constant-time comparison to prevent timing attacks
  return (
    token.length === CULQI_SECRET_KEY.length &&
    crypto.timingSafeEqual(
      Buffer.from(token, "utf8"),
      Buffer.from(CULQI_SECRET_KEY, "utf8")
    )
  );
}

/**
 * Returns true if the request is authentically from Culqi.
 * Tries RSA first, then Bearer, then allows in dev mode with a warning.
 */
function isRequestAuthentic(
  rawBody: string,
  req: NextRequest
): boolean {
  const rsaSignature = req.headers.get("x-culqi-signature");
  const authHeader = req.headers.get("authorization");

  // 1. RSA-SHA256 (most secure, recommended for production)
  if (CULQI_RSA_PUBLIC_KEY && rsaSignature) {
    return verifyRsaSignature(rawBody, rsaSignature, CULQI_RSA_PUBLIC_KEY);
  }

  // 2. Bearer token fallback
  if (authHeader) {
    return verifyBearerToken(authHeader);
  }

  // 3. No verification configured — allow only in non-production
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[Webhook] ⚠ No signature verification configured. " +
      "Set CULQI_RSA_PUBLIC_KEY + CULQI_RSA_ID in production."
    );
    return true;
  }

  // Production without verification → reject
  console.error(
    "[Webhook] Rejected: no signature provided and verification is required in production."
  );
  return false;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Read raw body BEFORE any JSON parsing (needed for signature verification)
  const rawBody = await req.text();

  // ── Authentication ──────────────────────────────────────────────────────────
  if (!isRequestAuthentic(rawBody, req)) {
    return NextResponse.json(
      { error: "Unauthorized: invalid webhook signature" },
      { status: 401 }
    );
  }

  // ── Parse event ─────────────────────────────────────────────────────────────
  let event: CulqiWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!event?.id || !event?.type || !event?.data) {
    return NextResponse.json(
      { error: "Malformed event: missing id, type, or data" },
      { status: 400 }
    );
  }

  // Guard: bookingId must exist in metadata
  if (!event.data.metadata?.bookingId) {
    console.warn(
      `[Webhook] Event ${event.id} has no bookingId in metadata — ignoring`
    );
    return NextResponse.json({ received: true, skipped: true });
  }

  console.log(`[Webhook] Received: ${event.type} | event=${event.id}`);

  // ── Route to handler ─────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case "charge.succeeded":
        await handleChargeSucceeded(event);
        break;

      case "charge.failed":
        await handleChargeFailed(event);
        break;

      default:
        // Acknowledge unknown events without processing
        // This prevents Culqi from retrying indefinitely
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    // Return 500 so Culqi retries the event
    console.error(`[Webhook] Error processing ${event.type} (${event.id}):`, error);
    return NextResponse.json(
      { error: "Internal processing error" },
      { status: 500 }
    );
  }
}

// Culqi sends POST only — disable other methods explicitly
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
