import { InspectionCardSkeleton } from '@/app/components/ui/Skeleton/InspectionCardSkeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-72 bg-gray-200 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-12 w-40 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        {/* Filters skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
          <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse sm:ml-auto" />
        </div>

        {/* Cards skeleton */}
        <InspectionCardSkeleton count={6} />
      </div>
    </div>
  );
}
