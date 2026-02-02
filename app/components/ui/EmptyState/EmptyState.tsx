'use client';

import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

function DefaultIcon() {
  return (
    <svg
      width="120"
      height="100"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
    >
      {/* Car body */}
      <path
        d="M20 60 L25 45 L40 40 L80 40 L95 45 L100 60 L100 70 L20 70 Z"
        stroke="#2D2D2D"
        strokeWidth="2"
        fill="none"
      />
      {/* Car roof */}
      <path
        d="M35 40 L40 25 L80 25 L85 40"
        stroke="#2D2D2D"
        strokeWidth="2"
        fill="none"
      />
      {/* Windows */}
      <path
        d="M42 38 L45 28 L58 28 L58 38 Z"
        stroke="#2D2D2D"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M62 38 L62 28 L75 28 L78 38 Z"
        stroke="#2D2D2D"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Wheels */}
      <circle cx="35" cy="70" r="10" stroke="#2D2D2D" strokeWidth="2" fill="none" />
      <circle cx="35" cy="70" r="4" stroke="#2D2D2D" strokeWidth="1.5" fill="none" />
      <circle cx="85" cy="70" r="10" stroke="#2D2D2D" strokeWidth="2" fill="none" />
      <circle cx="85" cy="70" r="4" stroke="#2D2D2D" strokeWidth="1.5" fill="none" />
      {/* Magnifying glass */}
      <circle cx="90" cy="35" r="18" stroke="#FFE14C" strokeWidth="3" fill="none" />
      <line x1="103" y1="48" x2="115" y2="60" stroke="#FFE14C" strokeWidth="3" strokeLinecap="round" />
      {/* Sparkles */}
      <path d="M15 30 L18 33 L15 36 L12 33 Z" fill="#FFE14C" />
      <path d="M105 15 L108 18 L105 21 L102 18 Z" fill="#FFE14C" />
    </svg>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const ActionButton = () => {
    const buttonClasses = `
      inline-flex items-center justify-center
      px-6 py-3 rounded-lg
      bg-[#FFE14C] text-[#2D2D2D]
      font-semibold text-sm
      hover:bg-[#FFD700]
      transition-colors duration-200
    `;

    if (actionHref) {
      return (
        <Link href={actionHref} className={buttonClasses}>
          {actionLabel}
        </Link>
      );
    }

    if (onAction) {
      return (
        <button onClick={onAction} className={buttonClasses}>
          {actionLabel}
        </button>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div
        className="
          border-2 border-dashed border-gray-200
          rounded-2xl p-12
          bg-white
          max-w-md w-full
          text-center
        "
      >
        {/* Icon */}
        <div className="mb-6">
          {icon || <DefaultIcon />}
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-[#2D2D2D] mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
          {description}
        </p>

        {/* Action */}
        {actionLabel && <ActionButton />}
      </div>
    </div>
  );
}
