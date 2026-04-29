// ============================================
// POST /api/culqi/order
// Crear una orden de pago en Culqi
//
// Las órdenes son útiles para:
// - Yape QR (el cliente escanea y paga)
// - Pagos diferidos con expiración
// - Múltiples intentos de pago
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { CulqiOrderRequestSchema, parseWithDetails } from "@/lib/validations/culqi";

const CULQI_SECRET_KEY = process.env.CULQI_SECRET_KEY;
const CULQI_API_URL = "https://api.culqi.com/v2/orders";

if (!CULQI_SECRET_KEY) {
  console.warn("[Culqi] CULQI_SECRET_KEY not configured");
}

interface CulqiOrderRequest {
  amount: number;
  currency_code: string;
  description: string;
  order_number: string;
  client_details: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
  expiration_date: number; // Unix timestamp in seconds
  confirm: boolean;
  metadata?: Record<string, string>;
}

interface CulqiOrderResponse {
  object: string;
  id: string; // ord_xxx
  amount: number;
  currency_code: string;
  description: string;
  order_number: string;
  state: "pending" | "paid" | "expired" | "deleted";
  total_fee: number | null;
  net_amount: number | null;
  fee_details: unknown | null;
  creation_date: number;
  expiration_date: number;
  updated_at: number | null;
  paid_at: number | null;
  available_on: number | null;
  metadata: Record<string, string>;
  qr?: {
    image: string; // Base64 QR image
    url: string;   // URL to payment page
  };
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

  // Validate CULQI_SECRET_KEY is configured
  if (!CULQI_SECRET_KEY) {
    console.error("[Culqi] CULQI_SECRET_KEY not configured");
    return NextResponse.json(
      { error: "Servicio de pagos no configurado" },
      { status: 503 }
    );
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON inválido" },
      { status: 400 }
    );
  }

  const validation = parseWithDetails(CulqiOrderRequestSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: validation.errors },
      { status: 400 }
    );
  }

  const { bookingId, expirationMinutes } = validation.data;

  try {
    // Fetch booking with all required data
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        inspectionPlan: true,
        client: {
          select: { id: true, email: true, name: true, phone: true },
        },
        vehicle: {
          include: {
            model: {
              include: { brand: true },
            },
          },
        },
      },
    });

    // Validations
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

    // Check if order already exists - fetch its current state
    if (booking.payment.culqiOrderId) {
      try {
        const existingOrderRes = await fetch(
          `${CULQI_API_URL}/${booking.payment.culqiOrderId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${CULQI_SECRET_KEY}`,
            },
          }
        );

        if (existingOrderRes.ok) {
          const existingOrder = (await existingOrderRes.json()) as CulqiOrderResponse;

          // If order is still pending, return its QR
          if (existingOrder.state === "pending") {
            return NextResponse.json({
              success: true,
              message: "Orden existente recuperada",
              order: {
                id: existingOrder.id,
                amount: existingOrder.amount / 100,
                currency: existingOrder.currency_code,
                state: existingOrder.state,
                expirationDate: new Date(existingOrder.expiration_date * 1000).toISOString(),
                qr: existingOrder.qr
                  ? {
                      image: existingOrder.qr.image,
                      url: existingOrder.qr.url,
                    }
                  : null,
              },
              booking: {
                id: booking.id,
                code: `#v-${booking.id.toString().padStart(5, "0")}`,
              },
            });
          }

          // If order is expired or deleted, clear it and create a new one
          if (existingOrder.state === "expired" || existingOrder.state === "deleted") {
            await db.payment.update({
              where: { id: booking.payment.id },
              data: { culqiOrderId: null },
            });
            // Continue to create new order below
          }

          // If order is paid, the booking should already be confirmed
          if (existingOrder.state === "paid") {
            return NextResponse.json(
              { error: "Esta orden ya fue pagada" },
              { status: 400 }
            );
          }
        } else {
          // Order not found in Culqi, clear it
          await db.payment.update({
            where: { id: booking.payment.id },
            data: { culqiOrderId: null },
          });
        }
      } catch (err) {
        console.error("[Culqi] Error checking existing order:", err);
        // Clear the order and try to create a new one
        await db.payment.update({
          where: { id: booking.payment.id },
          data: { culqiOrderId: null },
        });
      }
    }

    // Check expiration
    if (booking.expiresAt && new Date() > booking.expiresAt) {
      await db.booking.update({
        where: { id: bookingId },
        data: { status: "EXPIRED" },
      });

      await db.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: "FAILED",
          errorMessage: "Tiempo de pago expirado",
        },
      });

      return NextResponse.json(
        {
          error:
            "El tiempo para pagar ha expirado. Por favor, cree una nueva reserva.",
        },
        { status: 410 }
      );
    }

    // Prepare order description
    const vehicleDescription = `${booking.vehicle.model.brand.name} ${booking.vehicle.model.name} ${booking.vehicle.year}`;
    const description = `Inspección ${booking.inspectionPlan.type} - ${vehicleDescription}`;

    // Split name into first and last
    const nameParts = (booking.client.name || "Cliente").split(" ");
    const firstName = nameParts[0] || "Cliente";
    const lastName = nameParts.slice(1).join(" ") || "VerifiCARLO";

    // Calculate expiration (Unix timestamp in seconds)
    const expirationDate = Math.floor(
      (Date.now() + expirationMinutes * 60 * 1000) / 1000
    );

    // Format phone number (ensure it has country code)
    let phoneNumber = booking.client.phone || "900000000";
    phoneNumber = phoneNumber.replace(/\D/g, ""); // Remove non-digits
    if (!phoneNumber.startsWith("51")) {
      phoneNumber = "51" + phoneNumber;
    }

    // Create order in Culqi (order_number must be unique, add timestamp)
    const orderTimestamp = Date.now().toString(36);
    const culqiRequest: CulqiOrderRequest = {
      amount: booking.payment.amount,
      currency_code: "PEN",
      description,
      order_number: `VCAR-${booking.id.toString().padStart(6, "0")}-${orderTimestamp}`,
      client_details: {
        first_name: firstName,
        last_name: lastName,
        email: booking.client.email,
        phone_number: phoneNumber,
      },
      expiration_date: expirationDate,
      confirm: false, // Don't auto-confirm, wait for payment
      metadata: {
        bookingId: booking.id.toString(),
        inspectionType: booking.inspectionPlan.type,
        vehiclePlate: booking.vehicle.plate || "Sin placa",
      },
    };

    const culqiResponse = await fetch(CULQI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CULQI_SECRET_KEY}`,
      },
      body: JSON.stringify(culqiRequest),
    });

    const culqiData = await culqiResponse.json();

    if (!culqiResponse.ok) {
      const errorData = culqiData as CulqiErrorResponse;
      console.error("[Culqi] Order creation failed:", {
        error: errorData,
        request: {
          ...culqiRequest,
          client_details: { ...culqiRequest.client_details, email: "***" },
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: errorData.user_message || errorData.merchant_message || "Error creando orden de pago",
          code: errorData.code,
          details: process.env.NODE_ENV === "development" ? errorData.merchant_message : undefined,
        },
        { status: 400 }
      );
    }

    // Order created successfully
    const orderData = culqiData as CulqiOrderResponse;

    // Update payment with order ID
    await db.payment.update({
      where: { id: booking.payment.id },
      data: {
        culqiOrderId: orderData.id,
        metadata: orderData as object,
      },
    });

    console.log(
      `[Culqi] Order created: ${orderData.id} for booking #${bookingId}`
    );

    return NextResponse.json({
      success: true,
      message: "Orden de pago creada",
      order: {
        id: orderData.id,
        amount: orderData.amount / 100, // Convert to soles
        currency: orderData.currency_code,
        state: orderData.state,
        expirationDate: new Date(orderData.expiration_date * 1000).toISOString(),
        qr: orderData.qr
          ? {
              image: orderData.qr.image,
              url: orderData.qr.url,
            }
          : null,
      },
      booking: {
        id: booking.id,
        code: `#v-${booking.id.toString().padStart(5, "0")}`,
      },
    });
  } catch (error) {
    console.error("[Culqi] Order creation error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// GET — Check order status
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesión" },
      { status: 401 }
    );
  }

  const searchParams = req.nextUrl.searchParams;
  const bookingId = searchParams.get("bookingId");

  if (!bookingId || isNaN(parseInt(bookingId, 10))) {
    return NextResponse.json(
      { error: "bookingId inválido" },
      { status: 400 }
    );
  }

  try {
    const booking = await db.booking.findUnique({
      where: { id: parseInt(bookingId, 10) },
      include: {
        payment: {
          select: {
            culqiOrderId: true,
            status: true,
            amount: true,
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

    if (!booking.payment?.culqiOrderId) {
      return NextResponse.json(
        { error: "No hay orden asociada a esta reserva" },
        { status: 404 }
      );
    }

    // Fetch order status from Culqi
    const culqiResponse = await fetch(
      `${CULQI_API_URL}/${booking.payment.culqiOrderId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${CULQI_SECRET_KEY}`,
        },
      }
    );

    if (!culqiResponse.ok) {
      return NextResponse.json(
        { error: "Error consultando estado de la orden" },
        { status: 502 }
      );
    }

    const orderData = (await culqiResponse.json()) as CulqiOrderResponse;

    return NextResponse.json({
      success: true,
      order: {
        id: orderData.id,
        state: orderData.state,
        amount: orderData.amount / 100,
        paidAt: orderData.paid_at
          ? new Date(orderData.paid_at * 1000).toISOString()
          : null,
      },
      booking: {
        id: booking.id,
        status: booking.status,
      },
      payment: {
        status: booking.payment.status,
      },
    });
  } catch (error) {
    console.error("[Culqi] Order status check error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
