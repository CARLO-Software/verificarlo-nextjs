import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminLayoutClient } from './AdminLayoutClient';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== 'ADMIN') {
    redirect('/');
  }

  const userName = session.user.name || 'Admin';

  return (
    <AdminLayoutClient userName={userName}>
      {children}
    </AdminLayoutClient>
  );
}
