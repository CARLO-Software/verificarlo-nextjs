import { AgendarVehiculo, Brand, Inspection } from '@/app/vehiculo/types';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth';
import { convertirBogotaALocalUTC } from '@/app/domain/datetime';

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

    const fechaEstimadaLocal = convertirBogotaALocalUTC(payload.fechaEstimada, payload.horaEstimada);

    if (!payload.model || !payload.tipoInspeccion || !payload.year) {
        console.log(payload.model);
        console.log(payload.tipoInspeccion);
        console.log(payload.year);

        throw new Error('Faltan campos requeridos');
    }

    console.log("Millas: " + payload.mileage);
    console.log("La placa es: " + payload.plate);

    const schedule = await db.schedule.create({
        data: {
            user_id: Number(session.user.id),
            model_id: payload.model,
            inspection_id: payload.tipoInspeccion,
            year: payload.year,
            mileage: payload.mileage ?? null,
            plate: payload.plate,
            date_time: fechaEstimadaLocal
        }
    });

    return schedule;
}