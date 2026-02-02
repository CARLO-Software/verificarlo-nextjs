import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ============================================
// Admin Layout - Protección de rutas de administración
//
// Este layout verifica que el usuario tenga rol ADMIN.
// Si no tiene el rol adecuado, redirige al perfil.
// ============================================

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);

  // Verificar que el usuario sea ADMIN
  if (session?.user?.role !== 'ADMIN') {
    redirect('/');
  }

  return <>{children}</>;
}
