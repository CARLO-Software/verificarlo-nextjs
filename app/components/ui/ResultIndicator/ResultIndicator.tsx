'use client';

type ResultStatus = 'ok' | 'warning' | 'critical' | 'pending';

interface ResultItem {
  category: string;
  status: ResultStatus;
  detail?: string;
}

interface ResultIndicatorProps {
  results: ResultItem[];
}

const statusConfig: Record<ResultStatus, {
  color: string;
  bgColor: string;
  icon: string;
}> = {
  ok: {
    color: 'text-green-600',
    bgColor: 'bg-green-500',
    icon: '✓',
  },
  warning: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-500',
    icon: '⚠',
  },
  critical: {
    color: 'text-red-600',
    bgColor: 'bg-red-500',
    icon: '✕',
  },
  pending: {
    color: 'text-gray-400',
    bgColor: 'bg-gray-300',
    icon: '○',
  },
};

export function ResultIndicator({ results }: ResultIndicatorProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {results.map((result, index) => {
        const config = statusConfig[result.status];

        return (
          <div
            key={index}
            className="group relative flex items-center gap-1.5 cursor-default"
          >
            {/* Status dot */}
            <span
              className={`
                w-2 h-2 rounded-full ${config.bgColor}
                transition-transform duration-200 group-hover:scale-125
              `}
            />

            {/* Category label */}
            <span className={`text-xs font-medium ${config.color}`}>
              {result.category} {config.icon}
            </span>

            {/* Tooltip on hover */}
            {result.detail && (
              <div
                className="
                  absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                  px-2 py-1 bg-gray-800 text-white text-xs rounded
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                  whitespace-nowrap pointer-events-none
                  z-10
                "
              >
                {result.detail}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
