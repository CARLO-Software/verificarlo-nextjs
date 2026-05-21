export default function LoadingAdminReport() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-5 w-full bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="space-y-6">
          {/* Score section */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex gap-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-100 rounded-lg p-4">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Checklist skeleton */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg mb-3">
                <div className="p-4 bg-gray-50">
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
