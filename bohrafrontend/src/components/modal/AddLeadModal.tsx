import React, { useState } from "react";
import MultiLineInput from "../common/MultiLineInput";
import TextInput from "../common/TextInput";
import CustomSelect from "../common/CustomSelect";
import Modal from "../common/Modal";
import DateTimePickerInput from "../common/DateTimePickerInput";
import { useCreatePropertyLead } from "../../hooks/usePropertyLeads";
import { useCreateFinanceLead } from "../../hooks/useFinanceLeads";
import { useUsers } from "../../hooks/useUsers";
import type { CreatePropertyLeadData } from "../../services/propertyLeadsService";
import type { CreateFinanceLeadData } from "../../services/financeLeadsService";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  type: 'property' | 'finance';
};

type LeadFormState = {
  clientName: string;
  contactNumber: string;
  email: string;
  budget: string;
  loanRequirement: string;
  location: string;
  project: string;
  propertyType: string;
  eligibility: string;
  source: string;
  teamLead: string;
  relationshipManager: string;
  status: string;
  followUpDate: string;
  remarks: string;
  notes: string;
};

const sourceOptions = [
  { value: 'Website', label: 'Website' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Walk-in', label: 'Walk-in' },
  { value: 'Ad Campaign', label: 'Ad Campaign' },
];

const propertyStatusOptions = [
  { value: 'Follow up', label: 'Follow Up' },
  { value: 'Interested', label: 'Interested' },
  { value: 'Busy', label: 'Busy' },
];

const financeStatusOptions = [
  { value: 'Dead', label: 'Dead' },
  { value: 'Follow up', label: 'Follow Up' },
  { value: 'Interested', label: 'Interested' },
  { value: 'Busy', label: 'Busy' },
  { value: 'Closed', label: 'Closed' },
];

const propertyTypeOptions = [
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Residential', label: 'Residential' },
];

const AddLeadModal: React.FC<Props> = ({ isOpen, onClose, type }) => {
  const createPropertyLead = useCreatePropertyLead();
  const createFinanceLead = useCreateFinanceLead();
  const { data: usersData, isLoading: usersLoading } = useUsers();

  const domainUsers = (usersData?.users || []).filter(
    (user) => (user.domain || '').toLowerCase() === type
  );

  const teamLeadOptions = domainUsers
    .filter((user) => user.role?.toLowerCase() === 'teamlead')
    .map((user) => ({
      value: user._id || user.id,
      label: `${user.name} (Team Lead)`,
    }));

  const relationshipManagerOptions = domainUsers
    .filter((user) => user.role?.toLowerCase() === 'employee')
    .map((user) => ({
      value: user._id || user.id,
      label: `${user.name} (RM)`,
    }));

  const userNameById = Object.fromEntries(
    domainUsers.map((user) => [user._id || user.id, user.name])
  );


  const [form, setForm] = useState<LeadFormState>({
    clientName: '',
    contactNumber: '',
    email: '',
    budget: '',
    loanRequirement: '',
    location: '',
    project: '',
    propertyType: '',
    eligibility: '',
    source: '',
    teamLead: '',
    relationshipManager: '',
    status: '',
    followUpDate: '',
    remarks: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: keyof LeadFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) => {
    const value = typeof e === 'string' ? e : e.target.value;
    setForm((s) => ({ ...s, [key]: value }));
  };

  const handlePhoneChange = (key: keyof LeadFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const raw = e.target.value;
    setForm((s) => ({ ...s, [key]: raw.replace(/\D/g, '').slice(0, 10) }));
  };

  const resetForm = () => {
    setForm({
      clientName: '',
      contactNumber: '',
      email: '',
      budget: '',
      loanRequirement: '',
      location: '',
      project: '',
      propertyType: '',
      eligibility: '',
      source: '',
      teamLead: '',
      relationshipManager: '',
      status: '',
      followUpDate: '',
      remarks: '',
      notes: '',
    });
    setError(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!form.clientName || !form.contactNumber) {
        setError('Client name and contact number are required');
        return;
      }

      if (type === 'property') {
        const propertyData: CreatePropertyLeadData = {
          clientName: form.clientName,
          contactNumber: form.contactNumber,
          email: form.email || undefined,
          budget: form.budget || undefined,
          location: form.location || undefined,
          project: form.project || undefined,
          propertyType: form.propertyType || undefined,
          source: form.source || undefined,
          followUpDate: form.followUpDate || undefined,
          status: form.status || undefined,
          notes: form.notes || undefined,
          remarks: form.remarks || undefined,
          teamLead: form.teamLead || undefined,
          relationshipManager: form.relationshipManager || undefined,
          teamLeadName: form.teamLead ? userNameById[form.teamLead] : undefined,
          relationshipManagerName: form.relationshipManager ? userNameById[form.relationshipManager] : undefined,
        };
        await createPropertyLead.mutateAsync(propertyData);
      } else {
        const financeData: CreateFinanceLeadData = {
          clientName: form.clientName,
          contactNumber: form.contactNumber,
          email: form.email || undefined,
          loanRequirement: form.loanRequirement || undefined,
          location: form.location || undefined,
          project: form.project || undefined,
          eligibility: form.eligibility || undefined,
          source: form.source || undefined,
          followUpDate: form.followUpDate || undefined,
          status: form.status || undefined,
          notes: form.notes || undefined,
          remarks: form.remarks || undefined,
          teamLead: form.teamLead || undefined,
          relationshipManager: form.relationshipManager || undefined,
          teamLeadName: form.teamLead ? userNameById[form.teamLead] : undefined,
          relationshipManagerName: form.relationshipManager ? userNameById[form.relationshipManager] : undefined,
        };
        await createFinanceLead.mutateAsync(financeData);
      }

      resetForm();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} panelClassName="w-full max-w-2xl shadow-2xl rounded-2xl">
      <div className="p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {type === 'property' ? 'Lead' : 'Finance Lead'}
            </h3>
            <p className="text-sm text-gray-500">Lead Information</p>
          </div>
          <button
            aria-label="close"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 border border-red-200 rounded-md bg-red-50">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          <div className="space-y-6">
            {/* Client Info: 2-column grid with 4 inputs */}
            <div className="flex flex-col gap-3">
              <div className="text-sm font-medium text-gray-700">Client Info</div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <TextInput
                  placeholder="Name *"
                  value={form.clientName}
                  onChange={handleChange('clientName')}
                />
                <TextInput
                  placeholder="Contact Number *"
                  value={form.contactNumber}
                  onChange={handlePhoneChange('contactNumber')}
                />
                <TextInput
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange('email')}
                />
                {type === 'property' ? (
                  <>
                    <TextInput
                      placeholder="Budget"
                      value={form.budget}
                      onChange={handleChange('budget')}
                    />
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">Property Type</label>
                      <CustomSelect
                        placeholder="Select type"
                        value={form.propertyType}
                        onChange={handleChange('propertyType')}
                        options={propertyTypeOptions}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <TextInput
                      placeholder="Loan Requirement"
                      value={form.loanRequirement}
                      onChange={handleChange('loanRequirement')}
                    />
                    <TextInput
                      placeholder="Eligibility"
                      value={form.eligibility}
                      onChange={handleChange('eligibility')}
                    />
                  </>
                )}
                <TextInput
                  placeholder="Location"
                  value={form.location}
                  onChange={handleChange('location')}
                />
                <TextInput
                  placeholder="Project"
                  value={form.project}
                  onChange={handleChange('project')}
                />
              </div>
            </div>

            {/* Work Info: 2-column grid below Client Info */}
            <div className="flex flex-col gap-3">
              <div className="text-sm font-medium text-gray-700">Work Info</div>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <CustomSelect
                  placeholder="Team Lead Name"
                  value={form.teamLead}
                  onChange={handleChange('teamLead')}
                  options={teamLeadOptions}
                  disabled={usersLoading}
                />
                <CustomSelect
                  placeholder="Relationship Manager Name"
                  value={form.relationshipManager}
                  onChange={handleChange('relationshipManager')}
                  options={relationshipManagerOptions}
                  disabled={usersLoading}
                />
                <CustomSelect
                  placeholder="Source"
                  value={form.source}
                  onChange={handleChange('source')}
                  options={sourceOptions}
                />
              </div>
            </div>

            {/* Status Info: 2-column grid below Work Info */}
            <div className="flex flex-col gap-3">
              <div className="text-sm font-medium text-gray-700">Status Info</div>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <CustomSelect
                    placeholder="Select status"
                    value={form.status}
                    onChange={handleChange('status')}
                    options={type === 'property' ? propertyStatusOptions : financeStatusOptions}
                  />
                </div>
                <div className="flex-1">
                  <label className="block mb-1 text-sm font-medium">Follow Up Date</label>
                  <DateTimePickerInput
                    value={form.followUpDate || ''}
                    onChange={(iso) => handleChange('followUpDate')(iso)}
                    clearable
                  />
                </div>
                <MultiLineInput
                  placeholder="Notes"
                  value={form.notes}
                  onChange={handleChange('notes')}
                  rows={3}
                />
                <MultiLineInput
                  placeholder="Remarks"
                  value={form.remarks}
                  onChange={handleChange('remarks')}
                />
              </div>
            </div>

            {/* Remarks: full-width below Status Info */}

          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddLeadModal;
