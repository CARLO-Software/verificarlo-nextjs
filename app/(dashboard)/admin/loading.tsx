export default function AdminDashboardLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-7 bg-gray-200 rounded w-40 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-32" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl p-5 h-24" />
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-5 bg-gray-200 rounded w-48" />
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
