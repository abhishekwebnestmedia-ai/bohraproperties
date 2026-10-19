import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import RangeToggle from '../common/RangeToggle';

type TimeRange = 'Day' | 'Week' | 'Month' | 'Year';

interface PerformanceChartProps {
  performanceData?: {
    daily: Array<{ _id: string; leads: number; completed?: number; loggedIn?: number; }>;
    weekly: Array<{ _id: string; leads: number; completed?: number; loggedIn?: number; }>;
    monthly: Array<{ _id: string; leads: number; completed?: number; loggedIn?: number; }>;
    yearly: Array<{ _id: string; leads: number; completed?: number; loggedIn?: number; }>;
  };
  type?: 'property' | 'finance';
}

const PerformanceChart = ({ performanceData }: PerformanceChartProps) => {
  const [activeRange, setActiveRange] = useState<TimeRange>('Month');
  const timeRangeOptions = [
    { value: 'Day', label: 'Day' },
    { value: 'Week', label: 'Week' },
    { value: 'Month', label: 'Month' },
    { value: 'Year', label: 'Year' },
  ];

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

  const currentData = performanceData?.[getRangeKey(activeRange)] || [];
  
  // Transform data for chart - use _id as date
  const chartData = currentData.map(stat => ({
    date: stat._id,
    leads: stat.leads,
    closedDeals: stat.completed || stat.loggedIn || 0
  }));

  // Calculate total for display
  const totalLeads = currentData.reduce((sum, stat) => sum + stat.leads, 0);

  return (
    <div className="bg-white rounded-lg md:p-6 md:border md:border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="mb-1 text-sm text-gray-500">Statistics</p>
          <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
        </div>
        <div className="bg-white p-1 rounded-lg">
          <RangeToggle
            options={timeRangeOptions}
            activeValue={activeRange}
            onChange={(value) => setActiveRange(value as TimeRange)}
          />
        </div>
      </div>

      <div className="relative" style={{ height: '300px', minWidth: 0, minHeight: '300px' }}>
        {chartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Line
                  type="linear"
                  dataKey="leads"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Leads"
                />
                <Line
                  type="linear"
                  dataKey="closedDeals"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Closed Deals"
                />
              </LineChart>
            </ResponsiveContainer>
            
            {/* Total indicator */}
            {totalLeads > 0 && (
              <div className="absolute px-3 py-1 text-sm font-semibold text-gray-900 bg-yellow-400 rounded-md top-2 right-2">
                {totalLeads.toLocaleString()}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No performance data available
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceChart;
