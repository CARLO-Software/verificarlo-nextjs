'use client';

import { ReactNode } from 'react';

// ============================================
// RoleGuard: Renderiza contenido solo si el usuario tiene el rol permitido
// Es un componente de "protección visual", NO de seguridad real
// La seguridad real SIEMPRE debe estar en el backend (Server Actions/API)
// ============================================

type Role = 'CLIENT' | 'INSPECTOR' | 'ADMIN';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: Role[];      // Roles que pueden ver este contenido
  userRole: Role;            // Rol actual del usuario
  fallback?: ReactNode;      // Qué mostrar si no tiene permiso (opcional)
}

export default function RoleGuard({
  children,
  allowedRoles,
  userRole,
  fallback = null
}: RoleGuardProps) {
  // Verifica si el rol del usuario está en la lista de permitidos
  const hasAccess = allowedRoles.includes(userRole);

  // Si tiene acceso, muestra el contenido; si no, muestra el fallback
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// ============================================
// EJEMPLO DE USO:
//
// <RoleGuard allowedRoles={['ADMIN']} userRole={user.role}>
//   <button>Eliminar usuario</button>
// </RoleGuard>
//
// <RoleGuard
//   allowedRoles={['ADMIN', 'INSPECTOR']}
//   userRole={user.role}
//   fallback={<p>No tienes permiso</p>}
// >
//   <ScheduleEditor />
// </RoleGuard>
// ============================================
