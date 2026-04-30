'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Página intermedia que redirige al usuario según su rol.
 * Se usa como callbackUrl después de login con Google u otros providers.
 */
export default function RedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    const role = session?.user?.role;

    const redirectMap: Record<string, string> = {
      ADMIN: '/admin',
      INSPECTOR: '/inspector',
      CLIENT: '/mis-inspecciones',
    };

    router.replace(redirectMap[role as string] || '/mis-inspecciones');
  }, [status, session?.user?.role, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-[#FFE14C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  );
}
