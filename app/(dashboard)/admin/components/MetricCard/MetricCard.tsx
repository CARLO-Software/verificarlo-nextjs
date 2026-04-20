import { LucideIcon } from 'lucide-react';

const colorMap = {
  yellow: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-500' },
  red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500' },
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: keyof typeof colorMap;
}

export function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
  const colors = colorMap[color];

  return (
    <div className={`${colors.bg} rounded-lg sm:rounded-xl p-2.5 sm:p-4 lg:p-5`}>
      <div className="flex items-center justify-between mb-1.5 sm:mb-2 lg:mb-3">
        <span className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-500 truncate pr-1">{title}</span>
        <div className={`${colors.icon} flex-shrink-0`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
      <p className={`text-base sm:text-xl lg:text-2xl font-bold ${colors.text} truncate`}>{value}</p>
    </div>
  );
}
