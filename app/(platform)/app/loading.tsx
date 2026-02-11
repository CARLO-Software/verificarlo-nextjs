/**
 * Loading state para el Home del cliente.
 * Muestra skeleton mientras cargan los datos.
 */
export default function HomeLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-pulse">
      {/* Saludo */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-4 w-64 bg-gray-100 rounded mt-2" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>

      {/* CTA */}
      <div className="h-20 bg-gray-100 rounded-xl mb-8" />

      {/* Próxima inspección */}
      <div className="mb-8">
        <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
        <div className="h-32 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}
