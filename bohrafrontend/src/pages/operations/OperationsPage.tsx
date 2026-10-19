import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../../components/dashboard/StatCard";
import OperationsLeadSourceChart from "../../components/operations/OperationsLeadSourceChart";
import { TrendingUp, Loader2 } from "lucide-react";
import { useOperationsDashboard } from "../../hooks/useSpendings";
import RangeToggle from "../../components/common/RangeToggle";

const OperationsPage = () => {
  const navigate = useNavigate();
  const [hasVisitedSpendings, setHasVisitedSpendings] = useState(false);
  const [range, setRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  
  // Fetch live dashboard stats
  const { data: dashboardData, isLoading, error } = useOperationsDashboard(range);

  const handleSpendingClick = () => {
    setHasVisitedSpendings(true);
    navigate("/operation/spendings");
  };

  const totalLeads = dashboardData?.cards?.totalLeads ?? 0;
  const totalSpending = dashboardData?.cards?.totalSpending ?? 0;
  const conversionRate = dashboardData?.cards?.conversionRate ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review your lead sources and evaluate their performance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RangeToggle
            options={[
              { value: 'daily', label: 'Day' },
              { value: 'weekly', label: 'Week' },
              { value: 'monthly', label: 'Month' },
              { value: 'yearly', label: 'Year' },
            ]}
            activeValue={range}
            onChange={(v) => setRange(v as 'daily' | 'weekly' | 'monthly' | 'yearly')}
          />
          <button
            onClick={handleSpendingClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {hasVisitedSpendings ? "Past Spendings" : "Update Spending"}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-sm text-red-600">Failed to load spending data. Please try again.</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              title="Total Leads"
              value={totalLeads}
              change={0}
              icon={TrendingUp}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
            />
            <StatCard
              title="Total spending"
              value={`${totalSpending.toLocaleString()} ₹`}
              change={0}
              icon={TrendingUp}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
            />
            <StatCard
              title="Conversion Rate"
              value={`${conversionRate}%`}
              change={0}
              icon={TrendingUp}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
            />
          </div>

          {/* Chart */}
          <OperationsLeadSourceChart range={range} />
        </>
      )}
    </div>
  );
};

export default OperationsPage;
