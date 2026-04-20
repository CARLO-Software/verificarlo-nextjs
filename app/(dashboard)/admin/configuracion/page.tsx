import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ChangePasswordSection } from '@/app/components/shared/ChangePasswordSection';

async function getUserHasPassword(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  return !!user?.password;
}

export default async function ConfiguracionPage() {
  const session = await getServerSession(authOptions);
  const hasPassword = await getUserHasPassword(session!.user.id);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">
          Administra tu cuenta y seguridad
        </p>
      </div>

      {/* Sección de seguridad */}
      <ChangePasswordSection hasPassword={hasPassword} />
    </div>
  );
}
