/**
 * PlatformHeader: Header minimalista para compatibilidad.
 * Usado en otras partes del sistema que aún lo referencian.
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { UserMenu } from './UserMenu';

export function PlatformHeader() {
  return (
    <header className="h-14 border-b border-gray-100 bg-white">
      <div className="h-full max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link href="/app" className="flex items-center">
          <Image
            src="/assets/images/verificarlo-logo.png"
            alt="VerifiCARLO"
            width={120}
            height={28}
            className="h-7 w-auto brightness-0"
            priority
          />
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
