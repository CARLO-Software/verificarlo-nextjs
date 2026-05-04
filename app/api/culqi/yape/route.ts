// ============================================
// POST /api/culqi/yape
// Procesar pago con Yape (número + OTP)
// Flujo: Token Yape → Cargo
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const CULQI_PUBLIC_KEY = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY;
const CULQI_SECRET_KEY = process.env.CULQI_SECRET_KEY;
const CULQI_TOKENS_URL = "https://api.culqi.com/v2/tokens/yape";
const CULQI_CHARGES_URL = "https://api.culqi.com/v2/charges";

// Validación del request
const YapePaymentSchema = z.object({
  bookingId: z.number().int().positive(),
  phoneNumber: z.string().regex(/^9\d{8}$/, "Número de celular inválido"),
  otpCode: z.string().regex(/^\d{6}$/, "Código debe tener 6 dígitos"),
});

interface CulqiTokenResponse {
  object: string;
  id: string; // ype_live_xxx o ype_test_xxx
  type: string;
  email: string;
  creation_date: number;
  card_number: string;
  last_four: string;
  active: boolean;
  iin: {
    card_brand: string;
    card_type: string;
  };
}

interface CulqiChargeResponse {
  object: string;
  id: string; // chr_xxx
  amount: number;
  currency_code: string;
  email: string;
  description: string;
  source: {
    object: string;
    id: string;
    type: string;
  };
  outcome: {
    type: string;
    code: string;
    merchant_message: string;
    user_message: string;
  };
  fraud_score: number | null;
  reference_code: string;
  creation_date: number;
}

interface CulqiErrorResponse {
  object: string;
  type: string;
  code: string;
  merchant_message: string;
  user_message: string;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesión" },
      { status: 401 }
    );
  }

  if (!CULQI_SECRET_KEY || !CULQI_PUBLIC_KEY) {
    console.error("[Culqi Yape] Culqi keys not configured");
    return NextResponse.json(
      { error: "Servicio de pagos no configurado" },
      { status: 503 }
    );
  }

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON inválido" },
      { status: 400 }
    );
  }

  // Validate
  const validation = YapePaymentSchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.issues.map(i => i.message).join(", ");
    return NextResponse.json(
      { error: errors },
      { status: 400 }
    );
  }

  const { bookingId, phoneNumber, otpCode } = validation.data;

  try {
    // Fetch booking
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        inspectionPlan: true,
        client: {
          select: { id: true, email: true, name: true, phone: true, address: true, district: true },
        },
        vehicle: {
          include: {
            model: { include: { brand: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    if (booking.clientId !== session.user.id) {
      return NextResponse.json(
        { error: "No tiene acceso a esta reserva" },
        { status: 403 }
      );
    }

    if (booking.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "Esta reserva ya fue procesada" },
        { status: 400 }
      );
    }

    if (!booking.payment) {
      return NextResponse.json(
        { error: "No se encontró información de pago" },
        { status: 400 }
      );
    }

    // Check expiration
    if (booking.expiresAt && new Date() > booking.expiresAt) {
      await db.booking.update({
        where: { id: bookingId },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "El tiempo para pagar ha expirado" },
        { status: 410 }
      );
    }

    const amountInCents = booking.payment.amount;

    // Step 1: Create Yape Token (usa llave PÚBLICA)
    console.log(`[Culqi Yape] Creating token for booking #${bookingId}`);

    const tokenRes = await fetch(CULQI_TOKENS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CULQI_PUBLIC_KEY}`,
      },
      body: JSON.stringify({
        amount: amountInCents,
        fingerprint: `VCAR-${bookingId}-${Date.now()}`,
        number_phone: phoneNumber,
        otp: otpCode,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      const errorData = tokenData as CulqiErrorResponse;
      console.error("[Culqi Yape] Token creation failed:", errorData);

      // Mensajes de error más amigables
      let userError = errorData.user_message || "Error al validar con Yape";
      if (errorData.code === "invalid_otp") {
        userError = "Código de aprobación incorrecto o expirado. Genera uno nuevo en tu app de Yape.";
      } else if (errorData.code === "invalid_phone") {
        userError = "Número de celular no registrado en Yape.";
      }

      return NextResponse.json(
        { success: false, error: userError },
        { status: 400 }
      );
    }

    const token = tokenData as CulqiTokenResponse;
    console.log(`[Culqi Yape] Token created: ${token.id}`);

    // Step 2: Create Charge with Token
    const vehicleDescription = `${booking.vehicle.model.brand.name} ${booking.vehicle.model.name} ${booking.vehicle.year}`;
    const description = `Inspección ${booking.inspectionPlan.type} - ${vehicleDescription}`;

    const chargeRes = await fetch(CULQI_CHARGES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CULQI_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency_code: "PEN",
        email: booking.client.email,
        source_id: token.id,
        description: description.substring(0, 80),
        antifraud_details: {
          first_name: (booking.client.name || "Cliente").split(" ")[0],
          last_name: (booking.client.name || "Cliente").split(" ").slice(1).join(" ") || "VerifiCARLO",
          phone_number: phoneNumber,
          address: booking.client.address || "Av. Lima 123, Lima",
          address_city: booking.client.district || "Lima",
          country_code: "PE",
        },
        metadata: {
          bookingId: booking.id.toString(),
          inspectionType: booking.inspectionPlan.type,
          vehiclePlate: booking.vehicle.plate || "Sin placa",
          paymentMethod: "YAPE",
        },
      }),
    });

    const chargeData = await chargeRes.json();

    if (!chargeRes.ok) {
      const errorData = chargeData as CulqiErrorResponse;
      console.error("[Culqi Yape] Charge creation failed:", errorData);

      return NextResponse.json(
        {
          success: false,
          error: errorData.user_message || "Error procesando el pago",
        },
        { status: 400 }
      );
    }

    const charge = chargeData as CulqiChargeResponse;
    console.log(`[Culqi Yape] Charge created: ${charge.id} for booking #${bookingId}`);

    // Step 3: Update payment and booking status
    await db.$transaction([
      db.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: "COMPLETED",
          method: "YAPE_PLIN",
          culqiChargeId: charge.id,
          paidAt: new Date(),
          receiptNumber: charge.reference_code || charge.id,
          metadata: {
            chargeId: charge.id,
            tokenId: token.id,
            yapePhone: phoneNumber.substring(0, 3) + "****" + phoneNumber.substring(7),
          },
        },
      }),
      db.booking.update({
        where: { id: bookingId },
        data: {
          status: "PAID",
          expiresAt: null,
        },
      }),
    ]);

    console.log(`[Culqi Yape] Payment completed for booking #${bookingId}`);

    return NextResponse.json({
      success: true,
      message: "Pago completado exitosamente",
      charge: {
        id: charge.id,
        amount: charge.amount / 100,
        referenceCode: charge.reference_code,
      },
      booking: {
        id: booking.id,
        code: `#v-${booking.id.toString().padStart(5, "0")}`,
        status: "PAID",
      },
    });

  } catch (error) {
    console.error("[Culqi Yape] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
