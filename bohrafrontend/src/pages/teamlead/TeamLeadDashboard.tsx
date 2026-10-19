import { useState } from 'react';
import { UserPlus, FilePlus } from 'lucide-react';
import PropertyDashboard from '../dashboard/PropertyDashboard';
import FinanceDashboard from '../dashboard/FinanceDashboard';
import AddMemberModal, { type AddMemberStep1Data } from '../../components/modal/AddMemberModal';
import AddLeadModal from '../../components/modal/AddLeadModal';
import MemberDetailsModal from '../../components/modal/MemberDetailsModal';
import { getCurrentUser } from '../../utils/auth';

const TeamLeadDashboard = () => {
  const user = getCurrentUser();
  const dashboardType = user.domain === 'finance' ? 'Finance' : 'Property';

  const [open, setOpen] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [step1Data, setStep1Data] = useState<AddMemberStep1Data>({
    domain: user.domain || 'property',
    designation: 'employee',
    notes: '',
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening with your team today.
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 text-gray-700 rounded-lg cursor-pointer btn-hover">
            <span>Add New Member</span>
            <UserPlus className="w-4 h-4" />
          </button>
          <button onClick={() => setAddLeadOpen(true)} className="flex items-center gap-2 px-4 py-2 text-gray-700 rounded-lg cursor-pointer btn-hover">
            <span>Add Lead</span>
            <FilePlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Render the domain-specific dashboard */}
      {dashboardType === 'Property' ? <PropertyDashboard /> : <FinanceDashboard />}

      <AddMemberModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onNext={(data) => {
          setStep1Data(data);
          setOpen(false);
          setOpenDetails(true);
        }}
        userRole={user.role}
        userDomain={user.domain}
      />

      <AddLeadModal
        isOpen={addLeadOpen}
        onClose={() => setAddLeadOpen(false)}
        type={dashboardType === 'Property' ? 'property' : 'finance'}
      />

      <MemberDetailsModal
        isOpen={openDetails}
        onClose={() => setOpenDetails(false)}
        onBack={() => {
          setOpenDetails(false);
          setOpen(true);
        }}
        domain={step1Data.domain}
        designation={step1Data.designation}
      />
    </div>
  );
};

export default TeamLeadDashboard;
