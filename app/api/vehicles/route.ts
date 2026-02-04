// ============================================
// /api/vehicles
// Crear y obtener vehículos del usuario
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ============================================
// GET - Obtener vehículos del usuario
// ============================================

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesión" },
      { status: 401 }
    );
  }

  try {
    const vehicles = await db.vehicle.findMany({
      where: {
        userId: parseInt(session.user.id),
      },
      include: {
        model: {
          include: {
            brand: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("Error obteniendo vehículos:", error);
    return NextResponse.json(
      { error: "Error al obtener vehículos" },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Crear o encontrar vehículo existente
// ============================================

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesión" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { modelId, year, plate, mileage } = body;

  // Validaciones (placa es opcional)
  if (!modelId || !year) {
    return NextResponse.json(
      { error: "Se requiere modelId y year" },
      { status: 400 }
    );
  }

  // Normalizar placa si existe
  let normalizedPlate: string | null = null;
  if (plate && plate.trim()) {
    const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (cleanPlate.length < 6 || cleanPlate.length > 7) {
      return NextResponse.json(
        { error: "Placa inválida (debe tener 6-7 caracteres)" },
        { status: 400 }
      );
    }
    normalizedPlate = cleanPlate;
  }

  try {
    // Verificar si el modelo existe
    const model = await db.model.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      return NextResponse.json(
        { error: "Modelo de vehículo no válido" },
        { status: 400 }
      );
    }

    // Verificar que el año esté en el rango del modelo
    if (year < model.yearFrom || year > model.yearTo) {
      return NextResponse.json(
        { error: `El año debe estar entre ${model.yearFrom} y ${model.yearTo}` },
        { status: 400 }
      );
    }

    // Buscar vehículo existente por placa (solo si hay placa)
    if (normalizedPlate) {
      const existingVehicle = await db.vehicle.findFirst({
        where: { plate: normalizedPlate },
      });

      if (existingVehicle) {
        // Si la placa existe pero pertenece a otro usuario
        if (existingVehicle.userId !== parseInt(session.user.id)) {
          return NextResponse.json(
            { error: "Esta placa ya está registrada por otro usuario" },
            { status: 409 }
          );
        }

        // Si es del mismo usuario, actualizar datos si es necesario
        const updatedVehicle = await db.vehicle.update({
          where: { id: existingVehicle.id },
          data: {
            modelId,
            year,
            mileage: mileage !== undefined ? mileage : existingVehicle.mileage,
          },
          include: {
            model: {
              include: { brand: true },
            },
          },
        });

        return NextResponse.json({
          id: updatedVehicle.id,
          plate: updatedVehicle.plate,
          year: updatedVehicle.year,
          brand: updatedVehicle.model.brand.name,
          model: updatedVehicle.model.name,
          isNew: false,
        });
      }
    }

    // Crear nuevo vehículo
    const newVehicle = await db.vehicle.create({
      data: {
        userId: parseInt(session.user.id),
        modelId,
        year,
        plate: normalizedPlate,
        mileage: mileage !== undefined ? mileage : null,
      },
      include: {
        model: {
          include: { brand: true },
        },
      },
    });

    return NextResponse.json({
      id: newVehicle.id,
      plate: newVehicle.plate,
      year: newVehicle.year,
      brand: newVehicle.model.brand.name,
      model: newVehicle.model.name,
      isNew: true,
    });
  } catch (error: any) {
    console.error("Error creando vehículo:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Esta placa ya está registrada" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear vehículo" },
      { status: 500 }
    );
  }
}
