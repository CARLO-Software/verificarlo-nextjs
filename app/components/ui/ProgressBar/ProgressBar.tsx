'use client';

import { useEffect, useState } from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  currentStep?: number;
  totalSteps?: number;
  stepLabel?: string;
  showDots?: boolean;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  currentStep,
  totalSteps,
  stepLabel,
  showDots = false,
  animated = true,
}: ProgressBarProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(progress);
    }
  }, [progress, animated]);

  return (
    <div className="w-full">
      <div className="relative">
        {/* Background track */}
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          {/* Progress fill */}
          <div
            className="h-full bg-[#FFE14C] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${animatedProgress}%` }}
          />
        </div>

        {/* Dots indicators */}
        {showDots && (
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-0">
            {[0, 25, 50, 75, 100].map((dot) => (
              <div
                key={dot}
                className={`
                  w-2 h-2 rounded-full border-2 transition-colors duration-300
                  ${animatedProgress >= dot
                    ? 'bg-[#FFE14C] border-[#FFE14C]'
                    : 'bg-white border-gray-300'
                  }
                `}
              />
            ))}
          </div>
        )}
      </div>

      {/* Step label */}
      {(currentStep && totalSteps) && (
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>Paso {currentStep} de {totalSteps}</span>
          {stepLabel && <span>{stepLabel}</span>}
        </div>
      )}
    </div>
  );
}
