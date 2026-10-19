import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import dayjs from 'dayjs';
import DateTimePickerInput from '../../components/common/DateTimePickerInput';
import DropdownSelect from '../../components/common/DropdownSelect';
import ToggleButton from '../../components/common/ToggleButton';
import ActionMenu from '../../components/common/ActionMenu';
import FilterWidgetMenu, { type FilterSection } from '../../components/common/FilterWidgetMenu';
import LeadHistoryPanel from '../../components/common/LeadHistoryPanel';
import AddLeadModal from '../../components/modal/AddLeadModal';
import BulkUploadButton from '../../components/common/BulkUploadButton';
import { usePropertyLeads, useUpdatePropertyLead, useDeletePropertyLead } from '../../hooks/usePropertyLeads';
import { useFinanceLeads, useUpdateFinanceLead, useDeleteFinanceLead } from '../../hooks/useFinanceLeads';
import { useUsers } from '../../hooks/useUsers';
import { exportPropertyLeads, exportFinanceLeads } from '../../services/exportService';
import type { PropertyLead, GetPropertyLeadsParams } from '../../services/propertyLeadsService';
import type { FinanceLead, GetFinanceLeadsParams } from '../../services/financeLeadsService';

// ─────────────────────────────────────────────────────────────────────────────
//  LeadsPage  –  combined Property + Finance leads hub
// ─────────────────────────────────────────────────────────────────────────────

type Domain = 'property' | 'finance';
type AnyLead = PropertyLead | FinanceLead;

const PROPERTY_TABS = [
  { value: 'Leads', label: 'Leads' },
  { value: 'Token', label: 'Token' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Dead', label: 'Dead' },
];
const FINANCE_TABS = [
  { value: 'Leads', label: 'Leads' },
  { value: 'login', label: 'Login' },
  { value: 'Dead', label: 'Dead' },
];

const LeadsPage = () => {
  // ── Domain & tab ────────────────────────────────────────────────────────────
  const navigate = useNavigate();
  const [domain, setDomain] = useState<Domain>('property');
  const [activeTab, setActiveTab] = useState('Leads');

  useEffect(() => { setActiveTab('Leads'); }, [domain]);

  // ── Modals ──────────────────────────────────────────────────────────────────
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  // ── Search ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [selectedTeamLeads, setSelectedTeamLeads] = useState<string[]>([]);
  const [selectedRMs, setSelectedRMs] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedTransferTo, setSelectedTransferTo] = useState<string[]>([]);
  const [createdDateFrom, setCreatedDateFrom] = useState('');
  const [createdDateTo, setCreatedDateTo] = useState('');
  const [followUpDateFrom, setFollowUpDateFrom] = useState('');
  const [followUpDateTo, setFollowUpDateTo] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Sort state
  const [sortByCol, setSortByCol] = useState<'createdAt' | 'followUpDate' | 'clientName'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (col: 'createdAt' | 'followUpDate' | 'clientName') => {
    if (sortByCol === col) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortByCol(col); setSortOrder('desc'); }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortByCol !== col) return <ChevronsUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3 h-3 ml-1 text-gray-700" />
      : <ChevronDown className="w-3 h-3 ml-1 text-gray-700" />;
  };

  // Reset filters on domain change
  useEffect(() => {
    setSelectedTeamLeads([]); setSelectedRMs([]); setSelectedEmployees([]); setSelectedTransferTo([]);
    setCreatedDateFrom(''); setCreatedDateTo(''); setFollowUpDateFrom(''); setFollowUpDateTo('');
    setSearchQuery(''); setSelectedStatuses([]);
  }, [domain]);

  // ── Users ────────────────────────────────────────────────────────────────────
  const { data: usersData } = useUsers();

  const teamLeads = useMemo(
    () => usersData?.users?.filter((u) => u.role === 'teamlead' && u.domain === domain).map((u) => u.name) ?? [],
    [usersData, domain]
  );
  const rms = useMemo(
    () => usersData?.users?.filter((u) => (u.role === 'rm' || u.role === 'employee') && u.domain === domain).map((u) => u.name) ?? [],
    [usersData, domain]
  );
  const employees = useMemo(
    () => usersData?.users?.filter((u) => u.role === 'employee' && u.domain === domain).map((u) => u.name) ?? [],
    [usersData, domain]
  );
  const employeeObjects = useMemo(
    () => usersData?.users?.filter((u) => u.role === 'employee' && u.domain === domain) ?? [],
    [usersData, domain]
  );

  // ── FilterWidgetMenu config ──────────────────────────────────────────────────
  const PROPERTY_STATUSES = ['Follow up', 'Interested', 'Busy'];
  const FINANCE_STATUSES = ['Dead', 'Follow up', 'Interested', 'Busy', 'Closed'];

  const filterSections: FilterSection[] = useMemo(() => [
    { key: 'teamLead', label: 'Team Lead', items: teamLeads },
    {
      key: 'rm', label: 'RM / Manager', items: rms,
      childItems: Object.fromEntries(
        rms.map((rm) => [
          rm,
          employeeObjects
            .filter((e: any) => e.teamleadName === rm || e.relationshipManagerName === rm)
            .map((e: any) => e.name),
        ])
      ),
    },
    { key: 'transfer', label: 'Transfer To', items: [...new Set([...teamLeads, ...rms, ...employees])] },
    { key: 'status', label: 'Status', items: domain === 'property' ? PROPERTY_STATUSES : FINANCE_STATUSES },
    { key: 'date', label: 'Created Date', items: [] },
    { key: 'followup', label: 'Follow Up Date', items: [] },
  ], [teamLeads, rms, employees, employeeObjects, domain]);

  const handleFilterToggle = (sectionKey: string, value: string) => {
    const toggle = (prev: string[]) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
    if (sectionKey === 'teamLead') setSelectedTeamLeads(toggle);
    else if (sectionKey === 'rm') setSelectedRMs(toggle);
    else if (sectionKey === 'transfer') setSelectedTransferTo(toggle);
    else if (sectionKey === 'status') setSelectedStatuses(toggle);
  };

  const handleFilterChild = (_: string, child: string) =>
    setSelectedEmployees((prev) =>
      prev.includes(child) ? prev.filter((v) => v !== child) : [...prev, child]
    );

  const handleDateChange = (rangeKey: string, field: 'from' | 'to', value: string) => {
    if (rangeKey === 'date') field === 'from' ? setCreatedDateFrom(value) : setCreatedDateTo(value);
    else if (rangeKey === 'followup') field === 'from' ? setFollowUpDateFrom(value) : setFollowUpDateTo(value);
  };

  const handleClearAllFilters = () => {
    setSelectedTeamLeads([]); setSelectedRMs([]); setSelectedEmployees([]); setSelectedTransferTo([]);
    setCreatedDateFrom(''); setCreatedDateTo(''); setFollowUpDateFrom(''); setFollowUpDateTo('');
    setSelectedStatuses([]);
  };

  const activeFilterCount =
    selectedTeamLeads.length + selectedRMs.length + selectedEmployees.length +
    selectedTransferTo.length + selectedStatuses.length +
    (createdDateFrom || createdDateTo ? 1 : 0) +
    (followUpDateFrom || followUpDateTo ? 1 : 0);

  // ── API params ────────────────────────────────────────────────────────────────
  const sharedFilterParams = {
    status: activeTab,
    limit: 20,
    page: 1,
    search: searchQuery || undefined,
    sortBy: sortByCol,
    order: sortOrder,
    teamLead: selectedTeamLeads.length > 0 ? selectedTeamLeads.join(',') : undefined,
    rm: selectedRMs.length > 0 ? selectedRMs.join(',') : undefined,
    employee: selectedEmployees.length > 0 ? selectedEmployees.join(',') : undefined,
    transferTo: selectedTransferTo.length > 0 ? selectedTransferTo.join(',') : undefined,
    activityStatus: selectedStatuses.length > 0 ? selectedStatuses.join(',') : undefined,
    from: createdDateFrom ? `${createdDateFrom}T00:00:00+05:30` : undefined,
    to: createdDateTo ? `${createdDateTo}T23:59:59.999+05:30` : undefined,
    followFrom: followUpDateFrom ? `${followUpDateFrom}T00:00:00+05:30` : undefined,
    followTo: followUpDateTo ? `${followUpDateTo}T23:59:59.999+05:30` : undefined,
  };

  // Always call both hooks; skip real query if not active domain
  const { data: propertyLeadsResponse, isLoading: propertyLoading, error: propertyError } =
    usePropertyLeads(domain === 'property' ? (sharedFilterParams as GetPropertyLeadsParams) : ({ page: 1, limit: 1 } as GetPropertyLeadsParams));

  const { data: financeLeadsResponse, isLoading: financeLoading, error: financeError } =
    useFinanceLeads(domain === 'finance' ? (sharedFilterParams as GetFinanceLeadsParams) : ({ page: 1, limit: 1 } as GetFinanceLeadsParams));

  const leads: AnyLead[] = domain === 'property'
    ? (propertyLeadsResponse?.data ?? [])
    : (financeLeadsResponse?.data ?? []);
  const isLoading = domain === 'property' ? propertyLoading : financeLoading;
  const fetchError = domain === 'property' ? propertyError : financeError;

  // ── Detail panel ──────────────────────────────────────────────────────────────
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [detailPanelMounted, setDetailPanelMounted] = useState(false);
  const [detailPanelVisible, setDetailPanelVisible] = useState(false);
  const [selectedLeadDetails, setSelectedLeadDetails] = useState<AnyLead | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});

  const updatePropertyMutation = useUpdatePropertyLead();
  const updateFinanceMutation = useUpdateFinanceLead();
  const deletePropertyMutation = useDeletePropertyLead();
  const deleteFinanceMutation = useDeleteFinanceLead();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const openDetailPanel = (lead: AnyLead) => {
    setSelectedLeadDetails(lead);
    setEditedValues({});
    setEditingField(null);
    setConfirmDelete(false);
    setDetailPanelMounted(true);
    requestAnimationFrame(() => setDetailPanelVisible(true));
  };

  const closeDetailPanel = () => {
    setDetailPanelVisible(false);
    setEditingField(null);
    setEditedValues({});
  };

  useEffect(() => {
    if (!detailPanelVisible && detailPanelMounted) {
      const t = setTimeout(() => {
        setDetailPanelMounted(false);
        setSelectedLeadDetails(null);
      }, 320);
      return () => clearTimeout(t);
    }
  }, [detailPanelVisible, detailPanelMounted]);

  const handleSave = async () => {
    if (!selectedLeadDetails || Object.keys(editedValues).length === 0) return;
    try {
      if (domain === 'property') {
        await updatePropertyMutation.mutateAsync({ id: selectedLeadDetails._id, data: editedValues });
      } else {
        await updateFinanceMutation.mutateAsync({ id: selectedLeadDetails._id, data: editedValues });
      }
      setEditedValues({});
      closeDetailPanel();
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedLeadDetails) return;
    try {
      if (domain === 'property') {
        await deletePropertyMutation.mutateAsync(selectedLeadDetails._id);
      } else {
        await deleteFinanceMutation.mutateAsync(selectedLeadDetails._id);
      }
      setConfirmDelete(false);
      closeDetailPanel();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const renderEditableField = (fieldName: string, value: any, isTextArea = false) => {
    const isEditing = editingField === fieldName;
    const displayValue = editedValues[fieldName] !== undefined ? editedValues[fieldName] : value;

    if (isEditing) {
      if (isTextArea) {
        return (
          <textarea autoFocus
            className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none"
            value={displayValue || ''}
            onChange={(e) => setEditedValues((p) => ({ ...p, [fieldName]: e.target.value }))}
            onBlur={() => setEditingField(null)}
            rows={3}
          />
        );
      }
      if (fieldName === 'followUpDate') {
        return (
          <DateTimePickerInput
            value={displayValue || ''}
            onChange={(iso) => {
              setEditedValues((p) => ({ ...p, [fieldName]: iso }));
            }}
            placeholder="Select follow-up"
            className="w-full"
          />
        );
      }
      return (
        <input autoFocus type="text"
          className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none"
          value={displayValue || ''}
          onChange={(e) => setEditedValues((p) => ({ ...p, [fieldName]: e.target.value }))}
          onBlur={() => setEditingField(null)}
        />
      );
    }

    return (
      <div className="text-sm cursor-pointer hover:bg-gray-100 px-2 py-1 rounded -mx-2" onClick={() => setEditingField(fieldName)}>
        {fieldName === 'followUpDate' && displayValue ? dayjs(displayValue).format('DD MMM YYYY, hh:mm A') : displayValue || '-'}
      </div>
    );
  };

  const tabOptions = domain === 'property' ? PROPERTY_TABS : FINANCE_TABS;
  const isPending = domain === 'property' ? updatePropertyMutation.isPending : updateFinanceMutation.isPending;
  const isDeleting = domain === 'property' ? deletePropertyMutation.isPending : deleteFinanceMutation.isPending;

  // Export CSV
  const handlePropertyExport = useCallback(() => exportPropertyLeads('csv'), []);
  const handleFinanceExport = useCallback(() => exportFinanceLeads('csv'), []);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">All leads across domains</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Domain switcher */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm font-medium">
            {(['property', 'finance'] as Domain[]).map((d) => (
              <button
                key={d}
                onClick={() => setDomain(d)}
                className={`px-4 py-2 transition-colors capitalize ${
                  domain === d ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <ActionMenu onExport={domain === 'property' ? handlePropertyExport : handleFinanceExport} />
          <BulkUploadButton module={domain} />
          <button
            onClick={() => setAddLeadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 py-2 mt-4 bg-gray-100">
        <div className="flex items-center gap-3 flex-wrap">
          <FilterWidgetMenu
            sections={filterSections}
            selected={{ teamLead: selectedTeamLeads, rm: selectedRMs, transfer: selectedTransferTo, status: selectedStatuses }}
            onToggle={handleFilterToggle}
            selectedChildren={{ rm: selectedEmployees }}
            onToggleChild={handleFilterChild}
            dateRanges={{
              date: { from: createdDateFrom, to: createdDateTo },
              followup: { from: followUpDateFrom, to: followUpDateTo },
            }}
            onDateChange={handleDateChange}
            onClearAll={handleClearAllFilters}
            activeCount={activeFilterCount}
          />
            <ToggleButton options={tabOptions} activeValue={activeTab} onChange={setActiveTab} />
          <div className="flex-1" />
          <div className="relative w-full sm:w-auto">
            <svg className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 pointer-events-none left-3 top-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              type="text" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads…"
              className="w-full sm:w-64 py-2 pl-10 pr-3 text-sm border border-gray-300 rounded-md outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border border-gray-200 flex flex-col justify-between rounded-bl-lg rounded-br-lg max-h-[70vh]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left"><input type="checkbox" className="border-gray-300 rounded" /></th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Client Name</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Contact</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Email</th>
                {domain === 'property' ? (
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Budget</th>
                ) : (
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Loan Req.</th>
                )}
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Location</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Team Lead</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">RM</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Source</th>
                <th
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap cursor-pointer select-none hover:text-gray-700"
                  onClick={() => handleSort('createdAt')}
                >
                  <span className="inline-flex items-center">Date <SortIcon col="createdAt" /></span>
                </th>
                <th
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap cursor-pointer select-none hover:text-gray-700"
                  onClick={() => handleSort('followUpDate')}
                >
                  <span className="inline-flex items-center">Follow Up <SortIcon col="followUpDate" /></span>
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Status</th>
                <th className="px-2 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={12} className="px-6 py-8 text-center text-gray-500">Loading leads…</td></tr>
              ) : fetchError ? (
                <tr><td colSpan={12} className="px-6 py-8 text-center text-red-500">Error loading leads</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={12} className="px-6 py-8 text-center text-gray-400">No leads found</td></tr>
              ) : (
                leads.map((lead) => {
                  const pl = lead as PropertyLead;
                  const fl = lead as FinanceLead;
                  return (
                    <tr
                      key={lead._id}
                      className={`group hover:bg-gray-50 cursor-pointer ${selectedRowId === lead._id ? 'bg-gray-100' : ''}`}
                      onClick={() => setSelectedRowId(lead._id)}
                      onDoubleClick={() => openDetailPanel(lead)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" checked={selectedRowId === lead._id} onChange={() => {}} className="border-gray-300 rounded" onClick={(e) => e.stopPropagation()} />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{lead.clientName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{lead.contactNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{lead.email || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {domain === 'property' ? pl.budget || '-' : fl.loanRequirement || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{lead.location || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{lead.teamLead?.name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{lead.relationshipManager?.name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{lead.source || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {lead.createdAt ? dayjs(lead.createdAt).format('DD MMM YYYY') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {lead.followUpDate ? dayjs(lead.followUpDate).format('DD MMM YYYY') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          lead.status === 'Dead' ? 'bg-red-100 text-red-800'
                          : lead.status === 'Completed' || lead.status === 'login' ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td
                        className="px-2 py-4 w-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => navigate(`/leads/${lead._id}?type=${domain}`)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                          title="View / Edit lead"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200">
          <span className="text-xs text-gray-500">{leads.length} {leads.length === 1 ? 'lead' : 'leads'} shown</span>
        </div>
      </div>

      {/* Add Lead Modal */}
      <AddLeadModal isOpen={addLeadOpen} onClose={() => setAddLeadOpen(false)} type={domain} />

      {/* Detail Panel */}
      {detailPanelMounted && (
        <>
          <div
            className={`fixed inset-0 z-60 bg-black/40 transition-opacity duration-200 ${detailPanelVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={closeDetailPanel}
          />
          <div className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-70 transform transition-transform duration-300 ${detailPanelVisible ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold">Lead Info</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={Object.keys(editedValues).length === 0 || isPending}
                    className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 disabled:opacity-50"
                  >
                    {isPending ? 'Saving…' : 'Save'}
                  </button>
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      disabled={isDeleting}
                      className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-red-600">Confirm?</span>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded hover:bg-red-600 disabled:opacity-50"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        No
                      </button>
                    </div>
                  )}
                  <button onClick={closeDetailPanel} className="px-3 py-1 text-sm text-gray-500 border border-gray-300 rounded hover:bg-gray-50">
                    Close
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 space-y-6 overflow-y-auto scrollbar-hidden">
                {selectedLeadDetails && (() => {
                  const pl = selectedLeadDetails as PropertyLead;
                  const fl = selectedLeadDetails as FinanceLead;
                  const effectiveStatus = editedValues.status ?? selectedLeadDetails.status;
                  const effectiveStage = editedValues.stage ?? pl.stage;
                  const isStatusLocked = domain === 'finance'
                    ? effectiveStatus === 'Dead' || effectiveStatus === 'Closed'
                    : effectiveStage === 'Completed' || effectiveStage === 'Dead';
                  return (
                    <>
                      {/* Client Info */}
                      <div>
                        <h3 className="mb-3 text-sm font-semibold text-gray-700">Client Info</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-gray-500">Name</label>
                            {renderEditableField('clientName', selectedLeadDetails.clientName)}
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Contact</label>
                            {renderEditableField('contactNumber', selectedLeadDetails.contactNumber)}
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Email</label>
                            {renderEditableField('email', selectedLeadDetails.email)}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {domain === 'property' ? (
                              <div>
                                <label className="text-xs text-gray-500">Budget</label>
                                {renderEditableField('budget', pl.budget)}
                              </div>
                            ) : (
                              <div>
                                <label className="text-xs text-gray-500">Loan Req.</label>
                                {renderEditableField('loanRequirement', fl.loanRequirement)}
                              </div>
                            )}
                            <div>
                              <label className="text-xs text-gray-500">Location</label>
                              {renderEditableField('location', selectedLeadDetails.location)}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Project</label>
                            {renderEditableField('project', selectedLeadDetails.project)}
                          </div>
                        </div>
                      </div>

                      {/* Work Info */}
                      <div>
                        <h3 className="mb-3 text-sm font-semibold text-gray-700">Work Info</h3>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-500">Team Lead</label>
                              <p className="text-sm">{selectedLeadDetails.teamLead?.name || '-'}</p>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">RM</label>
                              <p className="text-sm">{selectedLeadDetails.relationshipManager?.name || '-'}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-500">Source</label>
                              <p className="text-sm">{selectedLeadDetails.source || '-'}</p>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Created</label>
                              <p className="text-sm">{dayjs(selectedLeadDetails.createdAt).format('DD MMM YYYY')}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Info */}
                      <div>
                        <h3 className="mb-3 text-sm font-semibold text-gray-700">Status Info</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-gray-500">Status</label>
                            {editingField === 'status' && !isStatusLocked ? (
                              <DropdownSelect
                                autoFocus
                                value={editedValues.status ?? selectedLeadDetails.status ?? ''}
                                onChange={(v) => {
                                  setEditedValues((p) => ({ ...p, status: v }));
                                  setEditingField(null);
                                }}
                                onBlur={() => setEditingField(null)}
                                options={domain === 'property' ? [
                                  { value: 'Follow up', label: 'Follow Up' },
                                  { value: 'Interested', label: 'Interested' },
                                  { value: 'Busy', label: 'Busy' },
                                ] : [
                                  { value: 'Dead', label: 'Dead' },
                                  { value: 'Follow up', label: 'Follow Up' },
                                  { value: 'Interested', label: 'Interested' },
                                  { value: 'Busy', label: 'Busy' },
                                  { value: 'Closed', label: 'Closed' },
                                ]}
                              />
                            ) : (
                              <div
                                className={`flex items-center gap-2 px-2 py-1 rounded -mx-2 ${
                                  isStatusLocked ? 'cursor-not-allowed bg-gray-100 text-gray-500' : 'cursor-pointer hover:bg-gray-100'
                                }`}
                                onClick={() => {
                                  if (isStatusLocked) return;
                                  setEditingField('status');
                                }}
                                title={isStatusLocked ? 'Locked for this lead state' : 'Click to edit'}
                              >
                                <span className={`w-2 h-2 rounded-full inline-block ${
                                  effectiveStatus === 'Dead' || effectiveStatus === 'Closed' ? 'bg-red-500'
                                  : effectiveStatus === 'Interested' || effectiveStatus === 'login' ? 'bg-green-500'
                                  : 'bg-gray-400'
                                }`} />
                                <span className="text-sm">{effectiveStatus ?? '—'}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Follow Up Date</label>
                            {renderEditableField('followUpDate', selectedLeadDetails.followUpDate)}
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Notes</label>
                            {renderEditableField('notes', selectedLeadDetails.notes, true)}
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Remarks</label>
                            {renderEditableField('remarks', selectedLeadDetails.remarks, true)}
                          </div>
                        </div>
                      </div>

                      {/* History */}
                      <div>
                        <h3 className="mb-3 text-sm font-semibold text-gray-700">History</h3>
                        <LeadHistoryPanel
                          id={selectedLeadDetails._id}
                          type={domain === 'property' ? 'pleads' : 'fleads'}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
              {selectedLeadDetails && (
                <div className="p-4 border-t border-gray-100 shrink-0">
                  <button
                    onClick={() => navigate(`/leads/${selectedLeadDetails._id}?type=${domain}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span>View Complete Lead</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeadsPage;
