import { redirect } from 'next/navigation';
import { getProfile } from './actions';
import { UserProfile } from '@/app/components/Profile';

// ============================================
// Página de Perfil - Server Component
//
// Esta es la página principal del perfil.
// Es un Server Component porque:
// 1. Carga datos en el servidor (más rápido, menos JS al cliente)
// 2. Puede redirigir si no hay sesión
// 3. Pasa los datos al Client Component (UserProfile)
//
// El patrón es:
// - Server Component: carga datos
// - Client Component: interactividad (formulario)
// ============================================

// Metadata para SEO
export const metadata = {
  title: 'Mi Perfil | VerifiCARLO',
  description: 'Administra tu información personal',
};

export default async function PerfilPage() {
  // 1. Obtener perfil del usuario (Server Action)
  const result = await getProfile();

  // 2. Si no está autenticado, redirigir al login
  if (!result.success || !result.data) {
    redirect('/login');
  }

  // 3. Renderizar el componente de perfil con los datos
  return (
    <main>
      <UserProfile user={result.data} />
    </main>
  );
}
