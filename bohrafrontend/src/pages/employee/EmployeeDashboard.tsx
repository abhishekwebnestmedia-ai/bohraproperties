import { useState } from 'react';
import { FilePlus } from 'lucide-react';
import PropertyDashboard from '../dashboard/PropertyDashboard';
import FinanceDashboard from '../dashboard/FinanceDashboard';
import AddLeadModal from '../../components/modal/AddLeadModal';
import { getCurrentUser } from '../../utils/auth';

const EmployeeDashboard = () => {
  const user = getCurrentUser();
  const dashboardType = user.domain === 'finance' ? 'Finance' : 'Property';

  const [addLeadOpen, setAddLeadOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={() => setAddLeadOpen(true)} className="flex items-center gap-2 px-4 py-2 text-gray-700 transition-colors rounded-lg cursor-pointer hover:bg-white">
            <span>Add Lead</span>
            <FilePlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Render the domain-specific dashboard */}
      {dashboardType === 'Property' ? <PropertyDashboard /> : <FinanceDashboard />}

      <AddLeadModal
        isOpen={addLeadOpen}
        onClose={() => setAddLeadOpen(false)}
        type={dashboardType === 'Property' ? 'property' : 'finance'}
      />
    </div>
  );
};

export default EmployeeDashboard;





