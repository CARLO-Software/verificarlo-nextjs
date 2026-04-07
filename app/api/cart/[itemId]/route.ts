import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE - Eliminar item del carrito
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await getServerSession(authOptions);
  const { itemId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesion" },
      { status: 401 }
    );
  }

  // Verificar que el item pertenece al usuario
  const item = await db.cartItem.findFirst({
    where: {
      id: itemId,
      cart: { userId: session.user.id },
    },
  });

  if (!item) {
    return NextResponse.json(
      { error: "Item no encontrado" },
      { status: 404 }
    );
  }

  await db.cartItem.delete({
    where: { id: itemId },
  });

  return NextResponse.json({ success: true });
}

// PATCH - Actualizar item (cantidad, vehicleData)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await getServerSession(authOptions);
  const { itemId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesion" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { quantity, tempVehicleData } = body;

  // Verificar que el item pertenece al usuario
  const item = await db.cartItem.findFirst({
    where: {
      id: itemId,
      cart: { userId: session.user.id },
    },
  });

  if (!item) {
    return NextResponse.json(
      { error: "Item no encontrado" },
      { status: 404 }
    );
  }

  // Si la cantidad es 0 o menor, eliminar el item
  if (quantity !== undefined && quantity < 1) {
    await db.cartItem.delete({
      where: { id: itemId },
    });
    return NextResponse.json({ success: true, deleted: true });
  }

  const updatedItem = await db.cartItem.update({
    where: { id: itemId },
    data: {
      ...(quantity !== undefined && { quantity }),
      ...(tempVehicleData !== undefined && { tempVehicleData }),
    },
    include: {
      inspectionPlan: true,
    },
  });

  return NextResponse.json({ success: true, item: updatedItem });
}
