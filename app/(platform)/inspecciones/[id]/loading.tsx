/**
 * Loading state para el detalle de inspección.
 * Skeleton con la estructura del header de estado y cards.
 */
export default function InspectionDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-gray-300 to-gray-400 h-40" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-4">
        {/* Card principal */}
        <div className="h-28 bg-white rounded-2xl shadow-lg mb-6" />

        {/* Cards de información */}
        <div className="h-32 bg-white rounded-2xl shadow-sm mb-6" />
        <div className="h-24 bg-white rounded-2xl shadow-sm mb-6" />
        <div className="h-24 bg-white rounded-2xl shadow-sm mb-6" />
      </div>
    </div>
  );
}
