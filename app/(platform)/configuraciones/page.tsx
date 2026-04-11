/**
 * Configuraciones: Ajustes de cuenta.
 * Estilo Stripe/Linear - minimalista y funcional.
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import { ChevronLeft, Bell, Lock, CreditCard, User } from 'lucide-react';
import { ChangePasswordSection } from '@/app/components/shared/ChangePasswordSection';

async function getUserProfile(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  return { hasPassword: !!user?.password };
}

export default async function ConfiguracionesPage() {
  const session = await getServerSession(authOptions);
  const profile = await getUserProfile(session!.user.id);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/app"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft size={16} />
        Inicio
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Configuración</h1>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {/* Perfil */}
        <Section title="Perfil" icon={User}>
          <Link
            href="/perfil"
            className="block py-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Ver y editar información personal
          </Link>
        </Section>

        {/* Notificaciones */}
        <Section title="Notificaciones" icon={Bell}>
          <div className="space-y-3 py-2">
            <Toggle label="Email" description="Actualizaciones de inspecciones" defaultChecked />
            <Toggle label="SMS" description="Recordatorios de citas" defaultChecked />
            <Toggle label="WhatsApp" description="Comunicación directa" defaultChecked />
          </div>
        </Section>

        {/* Seguridad */}
        <Section title="Seguridad" icon={Lock}>
          <div className="py-2">
            <ChangePasswordSection hasPassword={profile.hasPassword} />
          </div>
        </Section>

        {/* Facturación */}
        <Section title="Facturación" icon={CreditCard}>
          <p className="py-3 text-sm text-gray-500">
            Para solicitar factura, contáctanos por WhatsApp con tu RUC después del pago.
          </p>
        </Section>
      </div>

      {/* Logout */}
      <Link
        href="/api/auth/signout"
        className="block text-center py-3 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
      >
        Cerrar sesión
      </Link>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <Icon size={16} className="text-gray-400" />
        <h2 className="text-sm font-medium text-gray-900">{title}</h2>
      </div>
      <div className="px-4">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  description,
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <div>
        <p className="text-sm text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="sr-only peer"
      />
      <div className="
        relative w-10 h-6 rounded-full
        bg-gray-200 peer-checked:bg-gray-900
        transition-colors
        after:content-[''] after:absolute after:top-1 after:left-1
        after:w-4 after:h-4 after:rounded-full after:bg-white
        after:transition-transform peer-checked:after:translate-x-4
      " />
    </label>
  );
}
