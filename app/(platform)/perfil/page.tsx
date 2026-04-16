/**
 * Perfil: Información personal del usuario con edición.
 * Estilo Stripe/Linear - minimalista y funcional.
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ProfileForm } from './ProfileForm';

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
      _count: { select: { vehicles: true, clientBookings: true } },
    },
  });
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const profile = await getUserProfile(session!.user.id);

  if (!profile) return <div>Error cargando perfil</div>;

  const memberSince = new Intl.DateTimeFormat('es-PE', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(profile.createdAt));

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
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Perfil</h1>
        <p className="text-sm text-gray-500 mt-1">Miembro desde {memberSince}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold text-gray-900">{profile._count.vehicles}</p>
          <p className="text-sm text-gray-500">Vehículos</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold text-gray-900">{profile._count.clientBookings}</p>
          <p className="text-sm text-gray-500">Inspecciones</p>
        </div>
      </div>

      {/* Formulario de edición */}
      <ProfileForm
        initialData={{
          name: profile.name || '',
          phone: profile.phone || '',
          address: profile.address || '',
          district: profile.district || '',
        }}
        email={profile.email}
      />
    </div>
  );
}
