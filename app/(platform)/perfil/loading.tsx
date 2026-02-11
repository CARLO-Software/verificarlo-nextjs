/**
 * Loading state para el perfil.
 * Muestra skeleton de las secciones del perfil.
 */
export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-8 w-32 bg-gray-200 rounded-lg" />
        <div className="h-4 w-48 bg-gray-100 rounded mt-2" />
      </div>

      {/* Avatar card */}
      <div className="h-48 bg-gray-100 rounded-xl mb-6" />

      {/* Info sections */}
      <div className="h-56 bg-gray-100 rounded-xl mb-6" />
      <div className="h-40 bg-gray-100 rounded-xl mb-6" />
      <div className="h-24 bg-gray-100 rounded-xl" />
    </div>
  );
}
