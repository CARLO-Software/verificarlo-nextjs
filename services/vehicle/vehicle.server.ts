import { AgendarVehiculo } from '@/app/vehiculo/types';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth';
import { getBrands, getInspections } from './vehicle.client';
import { convertirBogotaALocalUTC } from '@/app/domain/datetime';

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

// export default async function VehiculoPage() {
//     const [brands, inspections] = await Promise.all([
//         getBrands(),
//         getInspections()
//     ]);
//     return <VehiculoForm initialBrands = { brands } initialInspections = { inspections } />;
// }