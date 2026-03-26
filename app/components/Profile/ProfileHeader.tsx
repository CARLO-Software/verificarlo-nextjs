'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './Profile.module.css';
import type { Role } from '@/types/profile';

// ============================================
// ProfileHeader: Muestra avatar, nombre y badge de rol
// Es solo visual, no editable
// ============================================

interface ProfileHeaderProps {
  name: string;
  email: string;
  image: string | null;
  role: Role;
  createdAt: Date;
}

// Mapeo de roles a etiquetas en español
const ROLE_LABELS: Record<Role, string> = {
  CLIENT: 'Cliente',
  INSPECTOR: 'Inspector',
  ADMIN: 'Administrador',
};

// Colores para los badges de rol
const ROLE_COLORS: Record<Role, string> = {
  CLIENT: styles.badgeClient,
  INSPECTOR: styles.badgeInspector,
  ADMIN: styles.badgeAdmin,
};

export default function ProfileHeader({
  name,
  email,
  image,
  role,
  createdAt,
}: ProfileHeaderProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Genera iniciales si no hay imagen
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Formatea la fecha de registro
  const memberSince = new Date(createdAt).toLocaleDateString('es-PE', {
    month: 'long',
    year: 'numeric',
  });

  const showImage = image && !imageError;

  return (
    <header className={styles.header}>
      {/* Avatar */}
      <div className={styles.avatarWrapper}>
        {/* Fallback/placeholder siempre visible hasta que cargue la imagen */}
        <div
          className={styles.avatarFallback}
          style={{ opacity: showImage && imageLoaded ? 0 : 1 }}
        >
          {initials}
        </div>

        {/* Imagen del usuario */}
        {showImage && (
          <Image
            src={image}
            alt={name}
            width={80}
            height={80}
            className={styles.avatar}
            style={{ opacity: imageLoaded ? 1 : 0 }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
      </div>

      {/* Información básica */}
      <div className={styles.headerInfo}>
        <h1 className={styles.name}>{name}</h1>
        <p className={styles.email}>{email}</p>

        {/* Badge de rol */}
        <span className={`${styles.badge} ${ROLE_COLORS[role]}`}>
          {ROLE_LABELS[role]}
        </span>
      </div>

      {/* Fecha de registro (desktop) */}
      <p className={styles.memberSince}>Miembro desde {memberSince}</p>
    </header>
  );
}
