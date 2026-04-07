import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Obtener carrito del usuario
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ items: [] });
  }

  const cart = await db.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          inspectionPlan: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return NextResponse.json({
    items: cart?.items || [],
    cartId: cart?.id,
  });
}

// POST - Agregar item al carrito
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesion" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { inspectionPlanId, quantity = 1, tempVehicleData } = body;

  // Validar que el plan existe
  const plan = await db.inspectionPlan.findUnique({
    where: { id: inspectionPlanId },
  });

  if (!plan) {
    return NextResponse.json(
      { error: "Plan de inspeccion no valido" },
      { status: 400 }
    );
  }

  // Obtener o crear carrito
  let cart = await db.cart.findUnique({
    where: { userId: session.user.id },
  });

  if (!cart) {
    cart = await db.cart.create({
      data: { userId: session.user.id },
    });
  }

  // Verificar si ya existe el item
  const existingItem = await db.cartItem.findUnique({
    where: {
      cartId_inspectionPlanId: {
        cartId: cart.id,
        inspectionPlanId,
      },
    },
  });

  if (existingItem) {
    // Actualizar cantidad
    const updatedItem = await db.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + quantity,
        tempVehicleData: tempVehicleData || existingItem.tempVehicleData,
      },
      include: {
        inspectionPlan: true,
      },
    });

    return NextResponse.json({ success: true, item: updatedItem });
  }

  // Crear nuevo item
  const cartItem = await db.cartItem.create({
    data: {
      cartId: cart.id,
      inspectionPlanId,
      quantity,
      tempVehicleData,
    },
    include: {
      inspectionPlan: true,
    },
  });

  return NextResponse.json({ success: true, item: cartItem });
}

// DELETE - Vaciar carrito
export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesion" },
      { status: 401 }
    );
  }

  await db.cartItem.deleteMany({
    where: {
      cart: { userId: session.user.id },
    },
  });

  return NextResponse.json({ success: true });
}
