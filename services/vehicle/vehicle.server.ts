import { AgendarVehiculo, Brand, Inspection } from '@/app/vehiculo/types';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth';
import { crearFechaHoraSinConversion, crearFechaSinConversion, sumarMinutos } from '@/app/domain/datetime';

// ============================================
// GET - Server-side data fetching
// ============================================

/** Obtiene todas las marcas desde el servidor */
export async function getBrandsServer(): Promise<Brand[]> {
    const brands = await db.brand.findMany({
        orderBy: { name: "asc" },
    });
    return brands;
}

/** Obtiene todos los tipos de inspección desde el servidor */
export async function getInspectionsServer(): Promise<Inspection[]> {
    const inspections = await db.inspection.findMany({
        include: { items: true },
    });
    return inspections as Inspection[];
}

// ============================================
// POST - Agendar vehículo
// ============================================

export async function agendarVehiculo(payload: AgendarVehiculo) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        throw new Error("Usuario no encontrado");
    }

    // Validar campos requeridos (placa es opcional)
    if (!payload.model || !payload.tipoInspeccion || !payload.year) {
        throw new Error('Faltan campos requeridos');
    }

    const userId = Number(session.user.id);
    const plateValue = payload.plate?.trim().toUpperCase() || null;

    let vehicle;

    // Buscar si ya existe un vehículo con esta placa (solo si hay placa)
    if (plateValue) {
        const existingVehicle = await db.vehicle.findFirst({
            where: { plate: plateValue }
        });

        if (existingVehicle) {
            // Si existe y pertenece al mismo usuario, reutilizarlo
            if (existingVehicle.userId === userId) {
                vehicle = existingVehicle;
            } else {
                throw new Error('Esta placa ya está registrada por otro usuario');
            }
        }
    }

    // Si no encontramos vehículo existente, crear uno nuevo
    if (!vehicle) {
        vehicle = await db.vehicle.create({
            data: {
                userId: userId,
                modelId: payload.model,
                year: payload.year,
                plate: plateValue,
                mileage: payload.mileage,
            }
        });
    }

    // Construir fechas para el booking (sin conversión de zona horaria)
    const dateOnly = crearFechaSinConversion(payload.fechaEstimada);
    const startTime = crearFechaHoraSinConversion(payload.fechaEstimada, payload.horaEstimada);
    const endTime = sumarMinutos(startTime, 45);

    const booking = await db.booking.create({
        data: {
            clientId: userId,
            vehicleId: vehicle.id,
            inspectionId: payload.tipoInspeccion,
            date: dateOnly,
            timeSlot: payload.horaEstimada,
            startTime: startTime,
            endTime: endTime,
        }
    });

    return booking;
}