'use client';

import styles from './GradeStars.module.css';

interface GradeStarsProps {
  grade: number | null | undefined; // 1-4
  maxGrade?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const gradeLabels: Record<number, string> = {
  1: 'Crítico',
  2: 'Regular',
  3: 'Bueno',
  4: 'Excelente',
};

export function GradeStars({
  grade,
  maxGrade = 4,
  size = 'md',
  showLabel = false,
  className = '',
}: GradeStarsProps) {
  // Si no hay grade, no mostrar nada
  if (grade === null || grade === undefined) {
    return null;
  }

  const stars = [];
  for (let i = 1; i <= maxGrade; i++) {
    const isFilled = i <= grade;
    stars.push(
      <svg
        key={i}
        className={`${styles.star} ${isFilled ? styles.filled : styles.empty}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }

  return (
    <div className={`${styles.container} ${styles[size]} ${className}`}>
      <div className={styles.stars}>{stars}</div>
      {showLabel && grade && (
        <span className={styles.label}>{gradeLabels[grade]}</span>
      )}
    </div>
  );
}
