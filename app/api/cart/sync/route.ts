import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface LocalCartItem {
  inspectionPlanId: number;
  quantity: number;
  vehicleData?: {
    brandId: number;
    brandName: string;
    modelId: number;
    modelName: string;
    year: number;
    plate?: string;
  };
}

// POST - Sincronizar carrito de localStorage con BD
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesion" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { localItems }: { localItems: LocalCartItem[] } = body;

  // Obtener carrito existente en BD
  let cart = await db.cart.findUnique({
    where: { userId: session.user.id },
    include: { items: { include: { inspectionPlan: true } } },
  });

  if (!cart) {
    cart = await db.cart.create({
      data: { userId: session.user.id },
      include: { items: { include: { inspectionPlan: true } } },
    });
  }

  // Estrategia de merge: localStorage tiene prioridad para items nuevos
  // pero preservamos items existentes en BD
  const existingPlanIds = new Set(cart.items.map((i) => i.inspectionPlanId));

  const itemsToCreate = [];
  for (const localItem of localItems) {
    // Solo agregar si no existe ya en BD
    if (!existingPlanIds.has(localItem.inspectionPlanId)) {
      // Verificar que el plan existe
      const planExists = await db.inspectionPlan.findUnique({
        where: { id: localItem.inspectionPlanId },
      });

      if (planExists) {
        itemsToCreate.push({
          cartId: cart.id,
          inspectionPlanId: localItem.inspectionPlanId,
          quantity: localItem.quantity,
          ...(localItem.vehicleData && { tempVehicleData: localItem.vehicleData }),
        });
      }
    }
  }

  if (itemsToCreate.length > 0) {
    await db.cartItem.createMany({
      data: itemsToCreate,
    });
  }

  // Obtener carrito actualizado
  const updatedCart = await db.cart.findUnique({
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
    success: true,
    items: updatedCart?.items || [],
    merged: itemsToCreate.length,
  });
}
