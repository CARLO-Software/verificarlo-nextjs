/**
 * Vehículos: Lista simple de vehículos del usuario.
 * Estilo Stripe/Linear - minimalista y funcional.
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Plus, ChevronLeft, Car } from 'lucide-react';

async function getUserVehicles(userId: string) {
  return db.vehicle.findMany({
    where: { userId },
    include: {
      model: { include: { brand: true } },
      bookings: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function VehiclesPage() {
  const session = await getServerSession(authOptions);
  const vehicles = await getUserVehicles(session!.user.id);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/mis-inspecciones"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft size={16} />
        Inicio
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Vehículos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {vehicles.length} registrado{vehicles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/agendar"
          className="inline-flex items-center gap-2 py-2 px-4 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus size={16} />
          Agregar
        </Link>
      </div>

      {/* List */}
      {vehicles.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Car size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Sin vehículos registrados</p>
          <Link
            href="/agendar"
            className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-gray-900 hover:underline"
          >
            <Plus size={14} />
            Agregar vehículo
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {vehicle.model.brand.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={vehicle.model.brand.logo}
                    alt={vehicle.model.brand.name}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <Car size={16} className="text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {vehicle.model.brand.name} {vehicle.model.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {vehicle.year}
                    {vehicle.plate && ` · ${vehicle.plate}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {vehicle.bookings.length} inspección{vehicle.bookings.length !== 1 ? 'es' : ''}
                </p>
                <Link
                  href={`/agendar?vehicleId=${vehicle.id}`}
                  className="text-sm font-medium text-gray-900 hover:underline"
                >
                  Agendar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
