import { LineChart, Line, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

type ChartData = {
  value: number;
}[];

type Props = {
  title: string;
  value: string;
  change: string;
  isPositive?: boolean;
  chartData: ChartData;
  chartColor: string;
};

const StatCardWithChart = ({
  title,
  value,
  change,
  isPositive = true,
  chartData,
  chartColor,
}: Props) => {
  return (
    <div className="p-6 px-12 bg-white border border-gray-200 rounded-[1.25rem]">
      <div className="flex items-start justify-between">
        {/* Left side - Stats */}
        <div className="flex-shrink-0">
          <p className="mb-1 text-sm text-gray-500">Statistics</p>
          <h3 className="mb-3 text-xl font-semibold text-gray-900">{title}</h3>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-[2.8rem] font-bold text-gray-900">{value}</p>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`text-sm font-medium ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {change}
            </span>
            <TrendingUp
              className={`w-4 h-4 ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            />
          </div>
        </div>

        {/* Right side - Chart */}
        <div className="flex-1 ml-8" style={{ height: "120px", minWidth: "200px", minHeight: "120px" }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={120}>
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatCardWithChart;
