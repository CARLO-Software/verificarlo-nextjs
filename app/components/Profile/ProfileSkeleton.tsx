import styles from './Profile.module.css';

// ============================================
// ProfileSkeleton: Loading state del perfil
//
// Muestra un placeholder animado mientras se cargan los datos
// Mejora la UX evitando layout shift
// ============================================

export default function ProfileSkeleton() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header skeleton */}
        <header className={styles.header}>
          <div className={`${styles.skeleton} ${styles.skeletonAvatar}`} />
          <div className={styles.headerInfo}>
            <div className={`${styles.skeleton} ${styles.skeletonText}`} />
            <div
              className={`${styles.skeleton} ${styles.skeletonTextSmall}`}
              style={{ marginTop: 8 }}
            />
          </div>
        </header>

        {/* Form skeleton */}
        <div className={styles.form}>
          <div className={styles.section}>
            <div
              className={`${styles.skeleton} ${styles.skeletonText}`}
              style={{ width: 180 }}
            />
            <div className={styles.fieldsGrid}>
              <div
                className={styles.skeleton}
                style={{ height: 48, width: '100%' }}
              />
              <div
                className={styles.skeleton}
                style={{ height: 48, width: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
