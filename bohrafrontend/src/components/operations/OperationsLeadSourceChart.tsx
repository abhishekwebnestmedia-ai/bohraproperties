import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { useLeadSourceChart } from '../../hooks/useSpendings';

const COLORS: Record<string, string> = {
  WhatsApp: '#10b981',
  Meta: '#3b82f6',
  '99Acres': '#f59e0b',
  Referral: '#ec4899',
  'Walk in': '#8b5cf6',
  Google: '#06b6d4',
  Other: '#6b7280',
};

const ALL_SOURCES = Object.keys(COLORS);

type Props = {
  range: 'daily' | 'weekly' | 'monthly' | 'yearly';
};

const OperationsLeadSourceChart = ({ range }: Props) => {
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(new Set());

  const { data: chartRes, isLoading } = useLeadSourceChart(range);

  const toggleSource = (name: string) => {
    setHiddenSources((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const activeSources =
    chartRes?.data && chartRes.data.length > 0
      ? ALL_SOURCES.filter((s) =>
          chartRes.data.some((row) => (row[s] as number) > 0)
        )
      : ALL_SOURCES;

  const chartData = chartRes?.data ?? [];

  return (
    <div className="bg-white rounded-lg lg:p-6 lg:border lg:border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="mb-1 text-sm text-gray-500">Statistics</p>
          <h3 className="text-lg font-semibold text-gray-900">Lead Sources</h3>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-75">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 text-gray-400 h-75">
          <p className="text-sm">No lead data for this period</p>
          <p className="text-xs text-gray-300">Add leads to see source trends here</p>
        </div>
      ) : (
        <div style={{ height: '300px', minWidth: 0, minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={300}>
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              {activeSources.map((source) => (
                <Line
                  key={source}
                  type="linear"
                  dataKey={source}
                  stroke={COLORS[source]}
                  strokeWidth={hiddenSources.has(source) ? 0 : 2}
                  dot={
                    hiddenSources.has(source) ? false : { fill: COLORS[source], r: 4 }
                  }
                  activeDot={hiddenSources.has(source) ? false : { r: 6 }}
                  hide={hiddenSources.has(source)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Clickable legend */}
      <div className="flex flex-wrap items-center justify-center gap-1 mt-5">
        {ALL_SOURCES.map((name) => {
          const isHidden = hiddenSources.has(name);
          return (
            <button
              key={name}
              onClick={() => toggleSource(name)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                border transition-colors duration-150
                ${
                  isHidden
                    ? 'border-gray-200 bg-white text-gray-400'
                    : 'border-transparent bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
              title={isHidden ? `Show ${name}` : `Hide ${name}`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 transition-opacity ${
                  isHidden ? 'opacity-30' : 'opacity-100'
                }`}
                style={{ backgroundColor: COLORS[name] }}
              />
              <span className={isHidden ? 'line-through' : ''}>{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OperationsLeadSourceChart;
