/**
 * Perfil: Información personal del usuario con edición.
 * Diseño profesional con sección oscura (header) y sección blanca (contenido).
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import { ChevronLeft, Car, ClipboardCheck } from 'lucide-react';
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
    <div className="-mx-6 -mt-8">
      {/* Sección oscura - Header */}
      <section className="bg-[#0F0F12] px-6 pt-6 pb-8">
        {/* Back link */}
        <Link
          href="/mis-inspecciones"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ChevronLeft size={16} />
          Inicio
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Mi Perfil</h1>
          <p className="text-sm text-gray-400 mt-1">Miembro desde {memberSince}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#16161A] border border-[#2D2D35] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Car size={20} className="text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{profile._count.vehicles}</p>
                <p className="text-sm text-gray-400">Vehículos</p>
              </div>
            </div>
          </div>
          <div className="bg-[#16161A] border border-[#2D2D35] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ClipboardCheck size={20} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{profile._count.clientBookings}</p>
                <p className="text-sm text-gray-400">Inspecciones</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección blanca - Contenido */}
      <section className="bg-white min-h-[50vh] px-6 py-8 rounded-t-3xl -mt-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información personal</h2>
        <ProfileForm
          initialData={{
            name: profile.name || '',
            phone: profile.phone || '',
            address: profile.address || '',
            district: profile.district || '',
          }}
          email={profile.email}
        />
      </section>
    </div>
  );
}
