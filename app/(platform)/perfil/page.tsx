/**
 * Perfil del Cliente (/perfil).
 *
 * Permite ver y editar información personal:
 * - Nombre, email, teléfono
 * - Dirección (para inspecciones a domicilio)
 * - Configuración de cuenta
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { User, Mail, Phone, MapPin, Shield } from 'lucide-react';

async function getUserProfile(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      district: true,
      createdAt: true,
      _count: {
        select: {
          vehicles: true,
          clientBookings: true,
        },
      },
    },
  });
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const profile = await getUserProfile(session!.user.id);

  if (!profile) {
    return <div>Error cargando perfil</div>;
  }

  const memberSince = new Intl.DateTimeFormat('es-PE', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(profile.createdAt));

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Mi Perfil
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Gestiona tu información personal
        </p>
      </div>

      {/* Avatar y resumen */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4">
          {/* Avatar grande */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
            <span className="text-xl font-bold text-white">
              {profile.name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || '?'}
            </span>
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">{profile.name}</h2>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <p className="text-xs text-gray-400 mt-1">
              Miembro desde {memberSince}
            </p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{profile._count.vehicles}</p>
            <p className="text-xs text-gray-500">Vehículos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{profile._count.clientBookings}</p>
            <p className="text-xs text-gray-500">Inspecciones</p>
          </div>
        </div>
      </div>

      {/* Información personal */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Información personal</h3>
          <button className="text-sm text-[#c4a82f] hover:text-[#a08825] font-medium">
            Editar
          </button>
        </div>

        <div className="space-y-4">
          <ProfileField
            icon={User}
            label="Nombre completo"
            value={profile.name || 'No especificado'}
          />
          <ProfileField
            icon={Mail}
            label="Correo electrónico"
            value={profile.email}
            verified
          />
          <ProfileField
            icon={Phone}
            label="Teléfono"
            value={profile.phone || 'No especificado'}
          />
        </div>
      </div>

      {/* Dirección */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Dirección</h3>
          <button className="text-sm text-[#c4a82f] hover:text-[#a08825] font-medium">
            Editar
          </button>
        </div>

        <div className="space-y-4">
          <ProfileField
            icon={MapPin}
            label="Dirección"
            value={profile.address || 'No especificada'}
          />
          <ProfileField
            icon={MapPin}
            label="Distrito"
            value={profile.district || 'No especificado'}
          />
        </div>

        {!profile.address && (
          <p className="text-xs text-gray-400 mt-4 bg-gray-50 p-3 rounded-lg">
            Agrega tu dirección para inspecciones a domicilio
          </p>
        )}
      </div>

      {/* Seguridad */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Seguridad</h3>
        </div>

        <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Shield size={20} className="text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Cambiar contraseña</p>
            <p className="text-xs text-gray-500">Actualiza tu contraseña de acceso</p>
          </div>
        </button>
      </div>
    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
  verified,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  verified?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
        <Icon size={18} className="text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
      {verified && (
        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
          Verificado
        </span>
      )}
    </div>
  );
}
