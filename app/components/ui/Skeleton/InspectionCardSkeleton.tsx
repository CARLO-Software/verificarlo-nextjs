'use client';

interface InspectionCardSkeletonProps {
  count?: number;
}

function SingleSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="
        bg-white border border-gray-200 rounded-xl p-6
        animate-pulse
      "
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header row */}
      <div className="flex justify-between items-start mb-4">
        <div className="h-6 w-24 bg-gray-200 rounded-full" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>

      {/* Vehicle title */}
      <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-24 bg-gray-200 rounded mb-4" />

      {/* Details row */}
      <div className="flex gap-4 mb-4">
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-gray-200 rounded-full mb-2" />
      <div className="h-3 w-32 bg-gray-200 rounded" />

      {/* Divider */}
      <div className="border-t border-gray-100 my-4" />

      {/* Actions */}
      <div className="flex justify-between">
        <div className="h-5 w-24 bg-gray-200 rounded" />
        <div className="h-5 w-28 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export function InspectionCardSkeleton({ count = 3 }: InspectionCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <SingleSkeleton key={index} delay={index * 80} />
      ))}
    </div>
  );
}
