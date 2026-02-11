/**
 * Gestión de Vehículos del Cliente (/vehiculos).
 *
 * Permite al cliente:
 * - Ver sus vehículos registrados
 * - Agregar nuevos vehículos
 * - Editar información de vehículos existentes
 * - Eliminar vehículos (si no tienen inspecciones)
 * - Agendar inspección directamente desde un vehículo
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Plus, Car, Calendar, MoreVertical } from 'lucide-react';

async function getUserVehicles(userId: string) {
  return db.vehicle.findMany({
    where: { userId },
    include: {
      model: {
        include: {
          brand: true,
        },
      },
      bookings: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function VehiclesPage() {
  const session = await getServerSession(authOptions);
  const vehicles = await getUserVehicles(session!.user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Mis Vehículos
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {vehicles.length} vehículo{vehicles.length !== 1 ? 's' : ''} registrado{vehicles.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Link
          href="/agendar"
          className="
            inline-flex items-center gap-2
            bg-[#F5D849] hover:bg-[#e5c83a]
            text-gray-900 font-semibold text-sm
            px-4 py-2.5 rounded-lg
            transition-colors duration-200
          "
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Agregar vehículo</span>
          <span className="sm:hidden">Agregar</span>
        </Link>
      </div>

      {/* Lista de vehículos */}
      {vehicles.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={{
                id: vehicle.id,
                brand: vehicle.model.brand.name,
                brandLogo: vehicle.model.brand.logo,
                model: vehicle.model.name,
                year: vehicle.year,
                plate: vehicle.plate,
                mileage: vehicle.mileage,
                inspectionsCount: vehicle.bookings.length,
              }}
            />
          ))}

          {/* Card para agregar */}
          <Link
            href="/agendar"
            className="
              flex flex-col items-center justify-center gap-3
              min-h-[180px] p-6
              border-2 border-dashed border-gray-200 rounded-xl
              text-gray-400 hover:text-gray-600 hover:border-[#F5D849]
              transition-all duration-200
            "
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus size={24} />
            </div>
            <span className="font-medium">Agregar vehículo</span>
          </Link>
        </div>
      )}
    </div>
  );
}

interface VehicleCardProps {
  vehicle: {
    id: number;
    brand: string;
    brandLogo: string;
    model: string;
    year: number;
    plate: string | null;
    mileage: number | null;
    inspectionsCount: number;
  };
}

function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      {/* Header con logo y menú */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Logo de marca o icono genérico */}
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            {vehicle.brandLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vehicle.brandLogo}
                alt={vehicle.brand}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <Car size={24} className="text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-sm text-gray-500">{vehicle.year}</p>
          </div>
        </div>

        {/* Menú de opciones */}
        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Detalles */}
      <div className="space-y-2 mb-4">
        {vehicle.plate && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Placa</span>
            <span className="font-medium text-gray-900">{vehicle.plate}</span>
          </div>
        )}
        {vehicle.mileage && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Kilometraje</span>
            <span className="font-medium text-gray-900">
              {vehicle.mileage.toLocaleString()} km
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Inspecciones</span>
          <span className="font-medium text-gray-900">{vehicle.inspectionsCount}</span>
        </div>
      </div>

      {/* Acción */}
      <Link
        href={`/agendar?vehicleId=${vehicle.id}`}
        className="
          flex items-center justify-center gap-2 w-full
          py-2.5 rounded-lg
          bg-gray-100 hover:bg-[#F5D849]/20
          text-gray-700 hover:text-gray-900
          font-medium text-sm
          transition-colors duration-200
        "
      >
        <Calendar size={16} />
        Agendar inspección
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Car size={32} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Sin vehículos registrados
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        Agrega tu primer vehículo para poder agendar inspecciones
      </p>
      <Link
        href="/agendar"
        className="
          inline-flex items-center gap-2
          bg-[#F5D849] hover:bg-[#e5c83a]
          text-gray-900 font-semibold
          px-6 py-3 rounded-lg
          transition-colors
        "
      >
        <Plus size={20} />
        Agregar vehículo
      </Link>
    </div>
  );
}
