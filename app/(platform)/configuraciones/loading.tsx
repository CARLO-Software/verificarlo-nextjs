/**
 * Loading skeleton para la página de Configuraciones.
 * Muestra placeholders animados mientras carga el contenido.
 */
export default function ConfiguracionesLoading() {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-gray-50/50 to-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header skeleton */}
        <header className="mb-10">
          <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-5 w-64 bg-gray-100 rounded-lg animate-pulse mt-3" />
        </header>

        <div className="space-y-6">
          {/* Section skeletons */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-4 p-5 border-b border-gray-50">
                <div className="w-11 h-11 rounded-xl bg-gray-100 animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mt-2" />
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
