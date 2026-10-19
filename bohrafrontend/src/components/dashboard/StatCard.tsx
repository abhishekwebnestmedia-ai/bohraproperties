import { TrendingUp, TrendingDown, UserPlus, BarChart2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  avatarUrl?: string;
}

const StatCard = ({
  title,
  value,
  change,
  icon: Icon = UserPlus,
  iconBgColor = 'bg-sky-50',
  iconColor = 'text-sky-500',
  avatarUrl,
}: StatCardProps) => {
  const isPositive = change >= 0;
  void iconBgColor;

  return (
    <div className="relative px-4 py-3 overflow-hidden bg-white border rounded-xl border-sky-100">
      {/* Top-right action button */}
      <div className="absolute top-4 right-4">
        <button className="flex items-center justify-center w-10 h-10 transition-colors rounded-lg text-sky-500 bg-sky-50 hover:bg-sky-100">
          <Icon className={`w-5 h-5 ${iconColor} `}  />
        </button>
      </div>

      {/* Title row with optional avatar */}
      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-500">{title}</p>
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt="avatar"
            className="-ml-2 border-2 border-white rounded-full shadow-sm w-7 h-7"
          />
        )}
      </div>

      {/* Big value */}
      <div className="mt-2">
        <h3 className="text-lg font-semibold text-gray-900 md:text-xl">{value}</h3>
      </div>

      {/* Change row */}
      <div className="flex items-center gap-3 mt-3">
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-green-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? `+${change}%` : `${change}%`}
        </span>
        <span className="text-sm text-gray-500">from last month</span>

        <BarChart2 className="w-4 h-4 ml-2 text-gray-300" />
      </div>
    </div>
  );
};

export default StatCard;
