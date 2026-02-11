/**
 * Layout del Dashboard Cliente (Platform).
 *
 * Separado del layout público (landing) para dar sensación de "aplicación".
 * - Header horizontal minimalista con navegación
 * - Bottom nav en móvil (patrón de app nativa)
 * - Protección de ruta: redirige a login si no hay sesión
 * - Redirige a página de suspensión si la cuenta está suspendida
 */
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PlatformHeader, MobileBottomNav } from '@/app/components/Platform';

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Redirigir a login si no hay sesión
  if (!session?.user) {
    redirect('/login');
  }

  // Verificar si el usuario está suspendido
  if (session.user.status === 'SUSPENDED') {
    redirect('/cuenta-suspendida');
  }

  // Redirigir admins e inspectores a sus dashboards
  if (session.user.role === 'ADMIN') {
    redirect('/admin');
  }

  if (session.user.role === 'INSPECTOR') {
    redirect('/inspector');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fijo superior */}
      <PlatformHeader />

      {/* Contenido principal */}
      <main className="pb-20 md:pb-8">
        {children}
      </main>

      {/* Navegación inferior móvil */}
      <MobileBottomNav />
    </div>
  );
}
