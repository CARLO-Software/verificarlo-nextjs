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
    <div className={`${colors.bg} rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className={`${colors.icon}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
    </div>
  );
}
