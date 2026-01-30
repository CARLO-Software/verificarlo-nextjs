'use client';

import ProfileHeader from './ProfileHeader';
import ProfileForm from './ProfileForm';
import styles from './Profile.module.css';
import type { UserProfile as UserProfileType } from '@/types/profile';

// ============================================
// UserProfile: Componente principal del perfil
//
// Combina:
// - ProfileHeader: Avatar, nombre, rol
// - ProfileForm: Formulario editable según rol
//
// Recibe los datos del usuario como prop (desde Server Component)
// ============================================

interface UserProfileProps {
  user: UserProfileType;
}

export default function UserProfile({ user }: UserProfileProps) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header con avatar e info básica */}
        <ProfileHeader
          name={user.name}
          email={user.email}
          image={user.image}
          role={user.role}
          createdAt={user.createdAt}
        />

        {/* Formulario editable según rol */}
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
