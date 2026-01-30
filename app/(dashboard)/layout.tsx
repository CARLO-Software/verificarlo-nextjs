import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ============================================
// Dashboard Layout - Protección de rutas
//
// Este layout envuelve todas las páginas dentro de (dashboard)/
// y verifica que el usuario esté autenticado.
//
// Si no hay sesión, redirige al login.
//
// Los paréntesis en (dashboard) hacen que sea un "route group"
// - No afecta la URL (no agrega /dashboard a la ruta)
// - Permite compartir un layout entre varias páginas
// - Ejemplo: /perfil, /mis-reservas, /configuracion
// ============================================

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  // Verificar sesión en el servidor
  const session = await getServerSession(authOptions);

  // Si no hay sesión, redirigir al login
  if (!session) {
    redirect('/login');
  }

  // Si hay sesión, renderizar el contenido
  return <>{children}</>;
}
