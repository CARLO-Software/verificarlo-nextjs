/**
 * EmptyState: Estado sin inspecciones pendientes.
 * CTA principal para agendar.
 */
import Link from 'next/link';
import { Plus } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="text-center py-12">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Sin inspecciones pendientes
      </h2>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        Agenda una inspección para verificar tu próximo auto antes de comprarlo.
      </p>

      <Link
        href="/agendar"
        className="inline-flex items-center gap-2 py-3 px-6 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <Plus size={18} />
        Agendar inspección
      </Link>
    </div>
  );
}
