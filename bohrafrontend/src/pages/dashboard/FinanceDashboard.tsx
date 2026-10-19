import { useState } from 'react';
import { UserPlus, FileCheck, ClipboardList, CheckCircle, TrendingUp, Loader2 } from 'lucide-react';
import AddMemberModal from '../../components/modal/AddMemberModal';
import AddLeadModal from '../../components/modal/AddLeadModal';
import MemberDetailsModal from '../../components/modal/MemberDetailsModal';
import StatCard from '../../components/dashboard/StatCard';
import PerformanceChart from '../../components/dashboard/PerformanceChart';
import LeadSourceChart from '../../components/dashboard/LeadSourceChart';
import RecentLeadsTable from '../../components/dashboard/RecentLeadsTable';
import { useFinanceDashboard } from '../../hooks/useFinanceLeads';
import { getCurrentUser } from '../../utils/auth';

const FinanceDashboard = () => {
  const user = getCurrentUser();
  const [open, setOpen] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  // Fetch finance dashboard data
  const { data: dashboardData, isLoading, error } = useFinanceDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-sm text-red-600">Failed to load dashboard data. Please try again.</p>
      </div>
    );
  }

  // Calculate stats from dashboard data
  const totalLeadsValue = dashboardData?.cards?.loanApplications?.value || 0;
  const totalLeadsChange = dashboardData?.cards?.loanApplications?.change || 0;
  const activeDealsValue = dashboardData?.cards?.activeDeals?.value || 0;
  const activeDealsChange = dashboardData?.cards?.activeDeals?.change || 0;
  const loggedInValue = dashboardData?.cards?.loggedIn?.value || 0;
  const loggedInChange = dashboardData?.cards?.loggedIn?.change || 0;
  const pendingTasksValue = dashboardData?.cards?.pendingTasks?.value || 0;
  const pendingTasksChange = dashboardData?.cards?.pendingTasks?.change || 0;
  const conversionRateValue = dashboardData?.cards?.conversionRate?.value || 0;
  const conversionRateChange = dashboardData?.cards?.conversionRate?.change || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Loan Applications"
          value={totalLeadsValue}
          change={totalLeadsChange}
          icon={UserPlus}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Active Deals"
          value={activeDealsValue}
          change={activeDealsChange}
          icon={FileCheck}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Logged In"
          value={loggedInValue}
          change={loggedInChange}
          icon={ClipboardList}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Pending Tasks"
          value={pendingTasksValue}
          change={pendingTasksChange}
          icon={CheckCircle}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Conversion Rate"
          value={`${conversionRateValue}%`}
          change={conversionRateChange}
          icon={TrendingUp}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PerformanceChart performanceData={dashboardData?.performance} type="finance" />
        <LeadSourceChart sourcesData={dashboardData?.sources} type="finance" />
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 gap-6">
        <RecentLeadsTable leads={dashboardData?.recentLeads} type="finance" />
      </div>

      <AddMemberModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onNext={() => {
          setOpen(false);
          setOpenDetails(true);
        }}
        userRole={user.role}
        userDomain={user.domain}
      />

      <AddLeadModal
        isOpen={addLeadOpen}
        onClose={() => setAddLeadOpen(false)}
        type="finance"
      />

      <MemberDetailsModal
        isOpen={openDetails}
        onClose={() => setOpenDetails(false)}
        onBack={() => {
          setOpenDetails(false);
          setOpen(true);
        }}
      />
    </div>
  );
};

export default FinanceDashboard;
