import { useState } from 'react';
import { UserPlus, FileCheck, ClipboardList, CheckCircle, TrendingUp, Loader2 } from 'lucide-react';
import AddMemberModal from '../../components/modal/AddMemberModal';
import AddLeadModal from '../../components/modal/AddLeadModal';
import MemberDetailsModal from '../../components/modal/MemberDetailsModal';
import StatCard from '../../components/dashboard/StatCard';
import PerformanceChart from '../../components/dashboard/PerformanceChart';
import LeadSourceChart from '../../components/dashboard/LeadSourceChart';
import RecentLeadsTable from '../../components/dashboard/RecentLeadsTable';
import { usePropertyDashboard } from '../../hooks/usePropertyLeads';
import { getCurrentUser } from '../../utils/auth';
import BulkUploadButton from '../../components/common/BulkUploadButton';

const PropertyDashboard = () => {
  const user = getCurrentUser();
  const [open, setOpen] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  // Mock data for development
  const mockDashboardData = {
    success: true,
    range: 'yearly',
    cards: {
      totalLeads: { value: 150, change: 12 },
      activeDeals: { value: 45, change: 8 },
      completed: { value: 32, change: 15 },
      pending: { value: 18, change: -5 },
      token: { value: 5, change: 2 },
      conversionRate: { value: 21.3, change: 3.2 },
    },
    performance: {
      daily: [],
      weekly: [],
      monthly: [],
      yearly: [],
    },
    sources: {
      daily: [],
      weekly: [],
      monthly: [],
      yearly: [],
    },
    recentLeads: [],
  };

  // Fetch property dashboard data
  const { data: dashboardData, isLoading, error } = usePropertyDashboard();
  console.log('Property Dashboard Data:', dashboardData);
  console.log('Property Dashboard Error:', error);
  
  // Use mock data if API fails or returns no data
  const finalDashboardData = dashboardData?.success ? dashboardData : mockDashboardData;
  
  if (isLoading) {
    return (
      <>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>

      <div className="flex justify-end">
        <BulkUploadButton module="property" />
      </div>
      </>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">Failed to load dashboard data. Using mock data for development.</p>
      </div>
    );
  }

  // Calculate stats from dashboard data
  const totalLeadsValue = finalDashboardData?.cards?.totalLeads?.value || 0;
  const totalLeadsChange = finalDashboardData?.cards?.totalLeads?.change || 0;
  const activeDealsValue = finalDashboardData?.cards?.activeDeals?.value || 0;
  const activeDealsChange = finalDashboardData?.cards?.activeDeals?.change || 0;
  const completedDealsValue = finalDashboardData?.cards?.completed?.value || 0;
  const completedDealsChange = finalDashboardData?.cards?.completed?.change || 0;
  const pendingTasksValue = finalDashboardData?.cards?.pending?.value || 0;
  const pendingTasksChange = finalDashboardData?.cards?.pending?.change || 0;
  const conversionRateValue = finalDashboardData?.cards?.conversionRate?.value || 0;
  const conversionRateChange = finalDashboardData?.cards?.conversionRate?.change || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Leads"
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
          title="Completed Deals"
          value={completedDealsValue}
          change={completedDealsChange}
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
        <PerformanceChart performanceData={finalDashboardData?.performance} type="property" />
        <LeadSourceChart sourcesData={finalDashboardData?.sources} type="property" />
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 gap-6">
        <RecentLeadsTable leads={finalDashboardData?.recentLeads} type="property" />
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
        type="property"
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

export default PropertyDashboard;
