import { ProfileSkeleton } from '@/app/components/Profile';

// ============================================
// Loading UI para la página de perfil
//
// Next.js muestra este componente automáticamente
// mientras se carga el Server Component (page.tsx)
//
// Esto evita que la página quede en blanco durante la carga
// ============================================

export default function PerfilLoading() {
  return <ProfileSkeleton />;
}
