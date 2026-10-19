import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import RangeToggle from '../common/RangeToggle';

type TimeRange = 'Day' | 'Week' | 'Month' | 'Year';

interface LeadSourceChartProps {
  sourcesData?: {
    daily: Array<{ _id: string; count: number; }>;
    weekly: Array<{ _id: string; count: number; }>;
    monthly: Array<{ _id: string; count: number; }>;
    yearly: Array<{ _id: string; count: number; }>;
  };
  type?: 'property' | 'finance';
}

const LeadSourceChart = ({ sourcesData }: LeadSourceChartProps) => {
  const [activeRange, setActiveRange] = useState<TimeRange>('Year');
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(new Set());
  const timeRangeOptions = [
    { value: 'Day', label: 'Day' },
    { value: 'Week', label: 'Week' },
    { value: 'Month', label: 'Month' },
    { value: 'Year', label: 'Year' },
  ];

  const COLORS = ['#FFC107', '#9C27B0', '#E0BBE4', '#5B9BD5', '#34D399', '#F87171', '#60A5FA'];

  // Get data based on active range
  type RangeKey = 'daily' | 'weekly' | 'monthly' | 'yearly';
  const getRangeKey = (range: TimeRange): RangeKey => {
    switch (range) {
      case 'Day': return 'daily';
      case 'Week': return 'weekly';
      case 'Month': return 'monthly';
      case 'Year': return 'yearly';
      default: return 'yearly';
    }
  };

  const currentData = sourcesData?.[getRangeKey(activeRange)] || [];

  // Transform data for pie chart — all items (with color index stable)
  const allChartData = currentData.map(item => ({
    name: item._id,
    value: item.count
  }));

  // Filter out hidden sources for the visible pie
  const chartData = allChartData.filter(item => !hiddenSources.has(item.name));

  // Calculate total leads (only visible)
  const totalLeads = chartData.reduce((sum, item) => sum + item.value, 0);

  const toggleSource = (name: string) => {
    setHiddenSources(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="bg-white rounded-lg md:p-6 md:border md:border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="mb-1 text-sm text-gray-500">Statistics</p>
          <h3 className="text-lg font-semibold text-gray-900">Lead Sources</h3>
        </div>
        <div className="bg-white p-1 rounded-lg">
          <RangeToggle
            options={timeRangeOptions}
            activeValue={activeRange}
            onChange={(value) => setActiveRange(value as TimeRange)}
          />
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="flex items-center justify-between">
          {/* Pie Chart */}
          <div className="relative" style={{ width: '250px', height: '250px', minWidth: '250px', minHeight: '250px' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={250} minHeight={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute text-center transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
              <p className="text-3xl font-bold text-gray-900">{totalLeads}</p>
              <p className="text-sm text-gray-500">Total Leads</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 ml-8">
            <div className="space-y-3">
              {allChartData.map((item, index) => {
                const isHidden = hiddenSources.has(item.name);
                const visibleTotal = chartData.reduce((s, i) => s + i.value, 0);
                const percentage = visibleTotal > 0 && !isHidden
                  ? ((item.value / visibleTotal) * 100).toFixed(0)
                  : 0;
                return (
                  <button
                    key={item.name}
                    onClick={() => toggleSource(item.name)}
                    className={`w-full flex items-center justify-between text-left transition-opacity ${isHidden ? 'opacity-35' : 'opacity-100'}`}
                    title={isHidden ? `Show ${item.name}` : `Hide ${item.name}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full shrink-0 transition-all ${isHidden ? 'ring-1 ring-offset-1 ring-gray-300' : ''}`}
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className={`text-sm ${isHidden ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isHidden ? 'text-gray-400' : 'text-gray-900'}`}>
                        {item.value}
                      </span>
                      {!isHidden && (
                        <span className="text-xs text-gray-500">
                          ({percentage}%)
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {hiddenSources.size > 0 && (
              <button
                onClick={() => setHiddenSources(new Set())}
                className="mt-3 text-xs font-medium text-blue-600 transition-colors hover:text-blue-800"
              >
                Show all
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No lead source data available
        </div>
      )}
    </div>
  );
};

export default LeadSourceChart;
