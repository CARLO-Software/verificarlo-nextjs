/**
 * Mis Beneficios: Página de beneficios para clientes.
 * Estilo Stripe/Linear - minimalista y funcional.
 */
import Link from 'next/link';
import { ChevronLeft, Gift, Percent, Star, Clock } from 'lucide-react';

export default function MisBeneficiosPage() {
  // TODO: Obtener beneficios reales del usuario desde la base de datos
  const beneficios = [
    {
      id: 1,
      titulo: 'Descuento en tu próxima inspección',
      descripcion: 'Obtén 10% de descuento en tu próxima inspección por ser cliente frecuente.',
      tipo: 'descuento',
      valor: '10%',
      vigencia: '30 días',
      activo: true,
    },
    {
      id: 2,
      titulo: 'Inspección legal gratis',
      descripcion: 'Tu primera inspección legal express es completamente gratis.',
      tipo: 'gratis',
      valor: 'Gratis',
      vigencia: '7 días',
      activo: false,
    },
    {
      id: 3,
      titulo: 'Prioridad en citas',
      descripcion: 'Acceso prioritario para agendar citas en horarios de alta demanda.',
      tipo: 'prioridad',
      valor: 'VIP',
      vigencia: 'Permanente',
      activo: true,
    },
  ];

  const beneficiosActivos = beneficios.filter(b => b.activo);
  const beneficiosUsados = beneficios.filter(b => !b.activo);

  const getIconForType = (tipo: string) => {
    switch (tipo) {
      case 'descuento':
        return <Percent size={20} />;
      case 'gratis':
        return <Gift size={20} />;
      case 'prioridad':
        return <Star size={20} />;
      default:
        return <Gift size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/mis-inspecciones"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft size={16} />
        Inicio
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Mis Beneficios</h1>
        <p className="text-sm text-gray-500 mt-1">
          Descuentos y promociones exclusivas para ti
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold text-gray-900">{beneficiosActivos.length}</p>
          <p className="text-sm text-gray-500">Activos</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold text-gray-900">{beneficiosUsados.length}</p>
          <p className="text-sm text-gray-500">Usados</p>
        </div>
      </div>

      {/* Beneficios activos */}
      {beneficiosActivos.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-700">Beneficios disponibles</h2>
          <div className="space-y-3">
            {beneficiosActivos.map((beneficio) => (
              <div
                key={beneficio.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    {getIconForType(beneficio.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-gray-900">{beneficio.titulo}</h3>
                      <span className="flex-shrink-0 px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">
                        {beneficio.valor}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{beneficio.descripcion}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                      <Clock size={12} />
                      <span>Válido por {beneficio.vigencia}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Beneficios usados */}
      {beneficiosUsados.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-700">Beneficios utilizados</h2>
          <div className="space-y-3">
            {beneficiosUsados.map((beneficio) => (
              <div
                key={beneficio.id}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-60"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                    {getIconForType(beneficio.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-gray-600 line-through">{beneficio.titulo}</h3>
                      <span className="flex-shrink-0 px-2 py-1 text-xs font-semibold bg-gray-200 text-gray-600 rounded-full">
                        Usado
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{beneficio.descripcion}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {beneficios.length === 0 && (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Gift size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Sin beneficios disponibles</p>
          <p className="text-sm text-gray-400 mt-1">
            Los beneficios aparecerán aquí cuando estén disponibles
          </p>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>¿Cómo obtener más beneficios?</strong>
          <br />
          Realiza inspecciones con VerifiCARLO para acumular beneficios exclusivos.
        </p>
      </div>
    </div>
  );
}
