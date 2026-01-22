import { AgendarVehiculo } from '@/app/vehiculo/types';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth';


export async function agendarVehiculo(payload: AgendarVehiculo) {

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        throw new Error("Usuario no encontrado");
    }
    if (!payload.model || !payload.tipoInspeccion || !payload.year || !payload.mileage) {
        console.log(payload.model);
        console.log(payload.tipoInspeccion);
        console.log(payload.year);
        console.log(payload.mileage);

        throw new Error('Faltan campos requeridos');
    }
    const fechaHora = new Date(`${payload.fechaEstimada}T${payload.horaEstimada}`);

    const agenda = await db.agenda.create({
        data: {
            userId: Number(session.user.id),
            modelId: payload.model,
            inspeccionId: payload.tipoInspeccion,
            year: payload.year,
            mileage: payload.mileage,
            placa: payload.placa,
            fechaHora: fechaHora
        }
    });

    return agenda;
}