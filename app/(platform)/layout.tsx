/**
 * Platform Layout: Layout mínimo basado en decisiones.
 * Sin sidebar, sin bottom nav. El contenido ES la navegación.
 */
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MinimalHeader } from '@/app/components/Dashboard';

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.status === 'SUSPENDED') {
    redirect('/cuenta-suspendida');
  }

  if (session.user.role === 'ADMIN') {
    redirect('/admin');
  }

  if (session.user.role === 'INSPECTOR') {
    redirect('/inspector');
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <MinimalHeader />
      <main className="max-w-3xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
