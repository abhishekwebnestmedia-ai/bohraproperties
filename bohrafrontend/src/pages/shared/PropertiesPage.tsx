import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from 'dayjs';
import { MoreVertical, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import ToggleButton from "../../components/common/ToggleButton";
import DateTimePickerInput from "../../components/common/DateTimePickerInput";
import FilterWidgetMenu, { type FilterSection } from "../../components/common/FilterWidgetMenu";
import ActionMenu from "../../components/common/ActionMenu";
import BulkUploadButton from "../../components/common/BulkUploadButton";
import DropdownSelect from "../../components/common/DropdownSelect";
import AddLeadModal from "../../components/modal/AddLeadModal";
import { usePropertyLeads, useUpdatePropertyLead, useBulkDeletePropertyLeads, useUpdatePropertyLeadStage, useUpdatePropertyLeadStatus, usePropertyLeadHistory, useTransferPropertyLead, useBulkTransferPropertyLeads } from "../../hooks/usePropertyLeads";
import { useUsers } from "../../hooks/useUsers";
import { useAuth } from "../../hooks/useAuth";
import { exportPropertyLeads } from "../../services/exportService";
import type { PropertyLead, GetPropertyLeadsParams } from "../../services/propertyLeadsService";

const PROPERTY_STAGES = ['Lead', 'Token', 'Completed', 'Dead'] as const;

const PropertiesPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("Leads");
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkTransferTo, setBulkTransferTo] = useState('');
  const [rowTransferTo, setRowTransferTo] = useState<Record<string, string>>({});

  // Filter state
  const [selectedTeamLeads, setSelectedTeamLeads] = useState<string[]>([]);
  const [selectedRMs, setSelectedRMs] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedTransferTo, setSelectedTransferTo] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date range filters
  const [createdDateFrom, setCreatedDateFrom] = useState<string>("");
  const [createdDateTo, setCreatedDateTo] = useState<string>("");
  const [followUpDateFrom, setFollowUpDateFrom] = useState<string>("");
  const [followUpDateTo, setFollowUpDateTo] = useState<string>("");

  // Fetch users for filter dropdowns
  const { data: usersData } = useUsers();
  const roleNormalized = (currentUser?.role ?? '').toLowerCase().replace(/[^a-z]/g, '');
  const canTransferLeads = ['superadmin', 'admin', 'teamlead'].includes(roleNormalized);

  const transferTargets = useMemo(
    () =>
      usersData?.users
        ?.filter((u) => (u.domain ?? '').toLowerCase().trim() === 'property' && (u.role ?? '').toLowerCase().trim() === 'employee')
        .map((u) => ({ id: u.id || u._id, name: u.name })) || [],
    [usersData]
  );

  const transferTargetById = useMemo(
    () => Object.fromEntries(transferTargets.map((t) => [t.id, t.name])),
    [transferTargets]
  );

  // Filter users by role and domain (property)
  const teamLeads = useMemo(() => 
    usersData?.users?.filter(u => u.role === 'teamlead' && u.domain === 'property').map(u => u.name) || [],
    [usersData]
  );

  const rms = useMemo(() => 
    usersData?.users?.filter(u => (u.role === 'rm' || u.role === 'employee') && u.domain === 'property').map(u => u.name) || [],
    [usersData]
  );

  const employees = useMemo(() => 
    usersData?.users?.filter(u => u.role === 'employee' && u.domain === 'property').map(u => u.name) || [],
    [usersData]
  );

  // Full employee objects for RM -> employees mapping
  const employeeObjects = useMemo(() =>
    usersData?.users?.filter(u => u.role === 'employee' && u.domain === 'property') || [],
    [usersData]
  );

  // Sort state
  const [sortByCol, setSortByCol] = useState<'createdAt' | 'clientName'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (col: 'createdAt' | 'clientName') => {
    if (sortByCol === col) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortByCol(col); setSortOrder('asc'); }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortByCol !== col) return <ChevronsUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3 h-3 ml-1 text-gray-700" />
      : <ChevronDown className="w-3 h-3 ml-1 text-gray-700" />;
  };



  // Filter sections for FilterWidgetMenu
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
    { key: 'status', label: 'Status', items: ['Follow up', 'Interested', 'Busy'] },
    { key: 'date', label: 'Created Date', items: [] },
    { key: 'followup', label: 'Follow Up Date', items: [] },
  ], [teamLeads, rms, employees, employeeObjects]);

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
    setSelectedStatuses([]);
    setCreatedDateFrom(''); setCreatedDateTo(''); setFollowUpDateFrom(''); setFollowUpDateTo('');
  };

  const activeFilterCount =
    selectedTeamLeads.length + selectedRMs.length + selectedEmployees.length +
    selectedTransferTo.length + selectedStatuses.length +
    (createdDateFrom || createdDateTo ? 1 : 0) +
    (followUpDateFrom || followUpDateTo ? 1 : 0);

  const handlePropertyExport = useCallback(() => exportPropertyLeads('csv'), []);

  // Pagination state
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); setSelectedIds([]); }, [
    activeTab, searchQuery, sortByCol, sortOrder,
    selectedTeamLeads, selectedRMs, selectedEmployees, selectedTransferTo, selectedStatuses,
    createdDateFrom, createdDateTo, followUpDateFrom, followUpDateTo,
  ]);

  // Convert filters to API params
  const apiParams: GetPropertyLeadsParams = {
    status: activeTab,
    limit: 10,
    page,
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

  // Fetch leads with all filters
  const { data: leadsResponse, isLoading, error } = usePropertyLeads(apiParams);

  const leads = leadsResponse?.data || [];
  const meta = leadsResponse?.meta;

  const tabOptions = [
    { value: "Leads", label: "Leads" },
    { value: "Token", label: "Token" },
    { value: "Completed", label: "Completed" },
    { value: "Dead", label: "Dead" },
  ];

  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [detailPanelMounted, setDetailPanelMounted] = useState(false);
  const [detailPanelVisible, setDetailPanelVisible] = useState(false);
  const [selectedLeadDetails, setSelectedLeadDetails] = useState<PropertyLead | null>(null);

  // Inline editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Partial<PropertyLead>>({});
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [pendingStage, setPendingStage] = useState<'Lead' | 'Token' | 'Completed' | 'Dead' | null>(null);

  // Mutations
  const updateMutation = useUpdatePropertyLead();
  const stageMutation = useUpdatePropertyLeadStage();
  const statusMutation = useUpdatePropertyLeadStatus();
  const transferMutation = useTransferPropertyLead();
  const bulkTransferMutation = useBulkTransferPropertyLeads();
  const bulkDeleteMutation = useBulkDeletePropertyLeads();
  const { data: historyData, isLoading: historyLoading } = usePropertyLeadHistory(selectedLeadDetails?._id ?? '');

  const handleRowDoubleClick = (lead: PropertyLead) => {
    setSelectedLeadDetails(lead);
    setEditedValues({});
    setEditingField(null);
    setDetailPanelMounted(true);
    // small delay to allow mount before applying visible class
    requestAnimationFrame(() => setDetailPanelVisible(true));
  };

  const closeDetailPanel = () => {
    setDetailPanelVisible(false);
    setEditingField(null);
    setEditedValues({});
  };

  const handleFieldClick = (fieldName: string) => {
    setEditingField(fieldName);
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setEditedValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleFieldBlur = (fieldName: string) => {
    setEditingField(null);
    // Update local display with edited value
    const editedValuesRecord = editedValues as Record<string, any>;
    if (selectedLeadDetails && editedValuesRecord[fieldName] !== undefined) {
      setSelectedLeadDetails({
        ...selectedLeadDetails,
        [fieldName]: editedValuesRecord[fieldName]
      });
    }
  };

  const handleSave = async () => {
    if (!selectedLeadDetails || Object.keys(editedValues).length === 0) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedLeadDetails._id,
        data: editedValues
      });
      
      // Reset edited values after successful save
      setEditedValues({});
      closeDetailPanel();
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  // Render editable field
  const renderEditableField = (fieldName: string, value: any, isTextArea = false) => {
    const editedValuesRecord = editedValues as Record<string, any>;
    const displayValue = editedValuesRecord[fieldName] !== undefined ? editedValuesRecord[fieldName] : value;

    if (fieldName === 'followUpDate') {
      return (
        <DateTimePickerInput
          value={displayValue || ''}
          onChange={(iso) => handleFieldChange(fieldName, iso)}
          clearable
        />
      );
    }

    const isEditing = editingField === fieldName;

    if (isEditing) {
      if (isTextArea) {
        return (
          <textarea
            autoFocus
            className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={displayValue || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            onBlur={() => handleFieldBlur(fieldName)}
            rows={3}
          />
        );
      }

      return (
        <input
          autoFocus
          type="text"
          className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={displayValue || ''}
          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          onBlur={() => handleFieldBlur(fieldName)}
        />
      );
    }

    return (
      <div
        className="px-2 py-1 -mx-2 text-sm rounded cursor-pointer hover:bg-gray-100"
        onClick={() => handleFieldClick(fieldName)}
      >
        {displayValue || '-'}
      </div>
    );
  };

  // unmount panel after exit animation
  useEffect(() => {
    if (!detailPanelVisible && detailPanelMounted) {
      const t = setTimeout(() => {
        setDetailPanelMounted(false);
        setSelectedLeadDetails(null);
      }, 320); // slightly longer than CSS transition (300ms)
      return () => clearTimeout(t);
    }
  }, [detailPanelVisible, detailPanelMounted]);

  const handleStageAdvance = async (nextStage: 'Lead' | 'Token' | 'Completed' | 'Dead') => {
    if (!selectedLeadDetails) return;
    try {
      const res = await stageMutation.mutateAsync({ id: selectedLeadDetails._id, stage: nextStage });
      setSelectedLeadDetails(res.data ?? { ...selectedLeadDetails, stage: nextStage });
      setPendingStage(null);
    } catch {
      setPendingStage(null);
    }
  };

  const effectivePropertyStatus = selectedLeadDetails
    ? ((editedValues as Record<string, any>).status ?? selectedLeadDetails.status)
    : undefined;
  const effectivePropertyStage = selectedLeadDetails
    ? ((editedValues as Record<string, any>).stage ?? selectedLeadDetails.stage)
    : undefined;
  const isPropertyStatusLocked =
    effectivePropertyStage === 'Completed' || effectivePropertyStage === 'Dead';

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900"> Lead</h1>
        <div className="flex flex-wrap items-center gap-3">
          <ActionMenu onExport={handlePropertyExport} />
          <BulkUploadButton module="property" />
          <button
            onClick={() => setAddLeadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700"
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
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Widget Menu */}
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

          {/* Sort by name button */}
          <button
            onClick={() => handleSort('clientName')}
            title="Sort by client name"
            className={`flex items-center gap-1 p-2 rounded-lg hover:bg-gray-200 transition-colors ${sortByCol === 'clientName' ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <SortIcon col="clientName" />
          </button>

          {/* Toggle Tabs */}
          
            <ToggleButton
              options={tabOptions}
              activeValue={activeTab}
              onChange={setActiveTab}
            />
          

          <div className="flex-1" />

          {/* Search */}
          <div className="flex items-center gap-1 w-full sm:w-auto min-w-50 border border-gray-300 rounded-md px-2 py-1.5 bg-white">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search name, phone…"
              className="flex-1 text-sm outline-none min-w-20"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 leading-none text-base">&times;</button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2  border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="inline-flex items-center rounded-full bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white">
            {selectedIds.length} selected
          </span>

          {canTransferLeads && (
            <>
              <div className="w-56">
                <DropdownSelect
                  size="sm"
                  value={bulkTransferTo}
                  onChange={setBulkTransferTo}
                  placeholder="Transfer to employee..."
                  options={transferTargets.map((target) => ({ value: target.id, label: target.name }))}
                />
              </div>
              <button
                onClick={async () => {
                  if (!bulkTransferTo) return;
                  await bulkTransferMutation.mutateAsync({ ids: selectedIds, relationshipManager: bulkTransferTo });
                  setSelectedIds([]);
                  setBulkTransferTo('');
                }}
                disabled={!bulkTransferTo || bulkTransferMutation.isPending}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {bulkTransferMutation.isPending ? 'Transferring...' : 'Transfer Selected'}
              </button>
            </>
          )}

          <button
            onClick={async () => { await bulkDeleteMutation.mutateAsync(selectedIds); setSelectedIds([]); }}
            disabled={bulkDeleteMutation.isPending}
            className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete Selected'}
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="px-3 py-1.5 text-xs text-gray-700 border border-gray-300 rounded-md hover:bg-white"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden bg-white border border-gray-200 flex flex-col justify-between rounded-bl-lg rounded-br-lg max-h-[70vh]">
        <div className="overflow-x-auto overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="border-gray-300 rounded"
                    checked={leads.length > 0 && leads.every((l) => selectedIds.includes(l.id))}
                    onChange={(e) => setSelectedIds(e.target.checked ? leads.map((l) => l.id) : [])}
                  />
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                  Client Name
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                  Contact Number
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                  Email
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                  Budget
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                  Location
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                  Projects
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                  Team Lead
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                  Relationship Manager
                </th>
                {activeTab === 'Token' && (
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                    Transfer To
                  </th>
                )}
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                  Source
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                  Date
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                  Follow Up Date
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                  Notes
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                  Remarks
                </th>
                <th className="w-56 px-2 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={activeTab === 'Token' ? 16 : 15} className="px-6 py-8 text-center text-gray-500">
                    Loading leads...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={activeTab === 'Token' ? 16 : 15} className="px-6 py-8 text-center text-red-500">
                    Error loading leads: {error.message}
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'Token' ? 16 : 15} className="px-6 py-8 text-center text-gray-500">
                    No leads found
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`group hover:bg-gray-50 cursor-pointer ${
                      selectedLead === lead.id ? "bg-gray-100" : ""
                    }`}
                    onClick={() => setSelectedLead(lead.id)}
                    onDoubleClick={() => handleRowDoubleClick(lead)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="border-gray-300 rounded"
                        checked={selectedIds.includes(lead.id)}
                        onChange={() => setSelectedIds((prev) => prev.includes(lead.id) ? prev.filter((i) => i !== lead.id) : [...prev, lead.id])}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {lead.clientName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {lead.contactNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {lead.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {lead.budget || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {lead.location || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {lead.project || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {lead.teamLead?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {lead.relationshipManager?.name || '-'}
                    </td>
                      {activeTab === 'Token' && (
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {lead.relationshipManager?.name || '-'}
                        </td>
                      )}
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {lead.source || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{lead.createdAt ? dayjs(lead.createdAt).format('DD MMM YYYY') : '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{lead.followUpDate ? dayjs(lead.followUpDate).format('DD MMM YYYY, hh:mm A') : '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          lead.stage === "Completed"
                            ? "bg-green-100 text-green-800"
                            : lead.stage === "Dead"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {lead.status || lead.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {lead.notes || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {lead.remarks || '-'}
                    </td>
                    <td
                      className="w-56 px-2 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        {canTransferLeads && (
                          <>
                            <div className="w-36">
                              <DropdownSelect
                                size="sm"
                                value={rowTransferTo[lead.id] || ''}
                                onChange={(value) => setRowTransferTo((prev) => ({ ...prev, [lead.id]: value }))}
                                placeholder="Transfer to..."
                                options={transferTargets.map((target) => ({ value: target.id, label: target.name }))}
                              />
                            </div>
                            <button
                              onClick={async () => {
                                const transferTo = rowTransferTo[lead.id];
                                if (!transferTo) return;
                                await transferMutation.mutateAsync({
                                  id: lead._id,
                                  relationshipManager: transferTo,
                                  relationshipManagerName: transferTargetById[transferTo],
                                });
                                setRowTransferTo((prev) => ({ ...prev, [lead.id]: '' }));
                              }}
                              disabled={!rowTransferTo[lead.id] || transferMutation.isPending}
                              className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                              title="Transfer lead"
                            >
                              Go
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => navigate(`/leads/${lead._id}?type=property`)}
                          className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                          title="View / Edit lead"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <span className="text-sm text-gray-500">
            {meta ? `${meta.total} total` : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-2 text-gray-600 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {Array.from({ length: meta?.totalPages || 1 }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 rounded ${
                  p === page ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(p + 1, meta?.totalPages || 1))}
              disabled={page === (meta?.totalPages || 1)}
              className="p-2 text-gray-600 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Add Lead Modal */}
      <AddLeadModal 
        isOpen={addLeadOpen} 
        onClose={() => setAddLeadOpen(false)}
        type="property"
      />

      {/* Lead Detail Panel */}
      {detailPanelMounted && (
        <>
          {/* Backdrop (fade) */}
          <div
            className={`fixed inset-0 z-60 bg-black/40 transition-opacity duration-300 ${
              detailPanelVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={closeDetailPanel}
          />

          {/* Sliding Panel (translate) */}
          <div className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-70 transform transition-transform duration-300 ${
            detailPanelVisible ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="flex flex-col h-full">
              {/* Panel Header (no bottom border) */}
              <div className="flex items-center justify-between p-4">
                <h2 className="text-lg font-semibold">Lead Info</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSave}
                    disabled={Object.keys(editedValues).length === 0 || updateMutation.isPending}
                    className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50">Delete</button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 p-4 space-y-6 overflow-y-auto scrollbar-hidden">
                {selectedLeadDetails && (
                  <>
                    {/* Client Info */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-700">Client Info</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-500">Name</label>
                          {renderEditableField('clientName', selectedLeadDetails.clientName)}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">Contact Number</label>
                            {renderEditableField('contactNumber', selectedLeadDetails.contactNumber)}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Email</label>
                          {renderEditableField('email', selectedLeadDetails.email)}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">Budget</label>
                            {renderEditableField('budget', selectedLeadDetails.budget)}
                          </div>
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
                            <div className="text-sm">{selectedLeadDetails.teamLead?.name || '-'}</div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Relationship Manager</label>
                            <div className="text-sm">{selectedLeadDetails.relationshipManager?.name || '-'}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">Assigned RM</label>
                            <div className="text-sm">{selectedLeadDetails.relationshipManager?.name || '-'}</div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Source</label>
                            <div className="text-sm">{selectedLeadDetails.source || '-'}</div>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Lead Onboarded on</label>
                          <div className="text-sm">{selectedLeadDetails.createdAt ? dayjs(selectedLeadDetails.createdAt).format('DD MMM YYYY') : '-'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Stage Journey */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-700">Journey</h3>
                      <div className="flex items-center">
                        {PROPERTY_STAGES.map((s, idx) => {
                          const currentIdx = PROPERTY_STAGES.indexOf(selectedLeadDetails.stage);
                          const isDone = idx < currentIdx;
                          const isCurrent = idx === currentIdx;
                          const isNext = idx === currentIdx + 1 || (s === 'Dead' && selectedLeadDetails.stage !== 'Dead');
                          return (
                            <div key={s} className="flex items-center flex-1 min-w-0">
                              <button
                                disabled={!isNext || stageMutation.isPending}
                                onClick={() => setPendingStage(s)}
                                title={isNext ? `Advance to ${s}` : s}
                                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors text-center ${
                                  isDone ? 'bg-green-100 text-green-700' :
                                  isCurrent ? 'bg-gray-900 text-white' :
                                  isNext ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-dashed border-gray-300 cursor-pointer' :
                                  'bg-gray-50 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                {isDone ? `✓ ${s}` : s}
                              </button>
                              {idx < PROPERTY_STAGES.length - 1 && <div className="w-2 h-px bg-gray-300 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                      {pendingStage && (
                        <div className="flex items-center gap-2 p-2 mt-2 border rounded-lg bg-amber-50 border-amber-200">
                          <span className="flex-1 text-xs text-amber-800">Move to <strong>{pendingStage}</strong>? This cannot be undone.</span>
                          <button
                            onClick={() => handleStageAdvance(pendingStage)}
                            disabled={stageMutation.isPending}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-gray-900 rounded hover:bg-gray-700 disabled:opacity-50"
                          >
                            {stageMutation.isPending ? '...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setPendingStage(null)}
                            className="px-2.5 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Status Info */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-700">Status Info</h3>
                      <div className="space-y-3">
                        {/* Activity Status — custom dropdown */}
                        <div className="relative">
                          <label className="text-xs text-gray-500">Activity Status</label>
                          <div
                            className={`flex items-center justify-between px-2 py-1.5 rounded -mx-2 mt-0.5 ${
                              isPropertyStatusLocked
                                ? 'cursor-not-allowed bg-gray-100 text-gray-500'
                                : 'cursor-pointer hover:bg-gray-100'
                            }`}
                            onClick={() => {
                              if (isPropertyStatusLocked) return;
                              setStatusMenuOpen((v) => !v);
                            }}
                            title={isPropertyStatusLocked ? 'Locked for this lead state' : 'Click to edit'}
                          >
                            <span className="inline-flex items-center gap-1.5 text-sm">
                              <span className={`w-2 h-2 rounded-full ${
                                effectivePropertyStage === 'Dead' ? 'bg-red-500' :
                                effectivePropertyStatus === 'Interested' ? 'bg-green-500' :
                                effectivePropertyStatus === 'Busy' ? 'bg-yellow-500' :
                                effectivePropertyStatus ? 'bg-blue-400' : 'bg-gray-300'
                              }`} />
                              {effectivePropertyStatus || 'None'}
                            </span>
                            {!isPropertyStatusLocked && <ChevronDown className="w-3 h-3 text-gray-400" />}
                          </div>
                          {statusMenuOpen && !isPropertyStatusLocked && (
                            <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg">
                              {['Follow up', 'Interested', 'Busy'].map((opt) => (
                                <button
                                  key={opt}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                                    effectivePropertyStatus === opt ? 'font-medium text-gray-900 bg-gray-50' : 'text-gray-700'
                                  }`}
                                  onClick={() => {
                                    statusMutation.mutate({ id: selectedLeadDetails._id, status: opt });
                                    setSelectedLeadDetails({ ...selectedLeadDetails, status: opt });
                                    setStatusMenuOpen(false);
                                  }}
                                >
                                  {opt}
                                </button>
                              ))}
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
                          <label className="text-xs text-gray-500">Remark</label>
                          {renderEditableField('remarks', selectedLeadDetails.remarks, true)}
                        </div>
                      </div>
                    </div>

                    {/* History */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-700">History</h3>
                      {historyLoading ? (
                        <p className="py-2 text-xs text-gray-400">Loading history...</p>
                      ) : !historyData?.history?.length ? (
                        <p className="py-2 text-xs text-gray-400">No history yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {historyData.history.map((group: any) => (
                            <div key={group.user._id}>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center justify-center w-6 h-6 text-xs font-semibold text-gray-600 bg-gray-200 rounded-full">
                                  {(group.user.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs font-medium text-gray-700">{group.user.name || 'Unknown'}</span>
                              </div>
                              <div className="pl-3 ml-4 space-y-2 border-l-2 border-gray-100">
                                {group.activities.map((act: any) => (
                                  <div key={act._id} className="flex items-start gap-2">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                      act.color === 'green' ? 'bg-green-500' :
                                      act.color === 'red' ? 'bg-red-500' :
                                      act.color === 'blue' ? 'bg-blue-500' :
                                      act.color === 'orange' ? 'bg-orange-500' :
                                      act.color === 'purple' ? 'bg-purple-500' :
                                      'bg-gray-400'
                                    }`} />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-1">
                                        <span className="text-xs font-medium text-gray-800">{act.type}</span>
                                        <span className="text-xs text-gray-400 shrink-0">{act.timestamp}</span>
                                      </div>
                                      <p className="text-xs text-gray-500">{act.description}</p>
                                      {act.changes?.length > 0 && (
                                        <div className="mt-0.5 space-y-0.5">
                                          {act.changes.map((c: any, ci: number) => (
                                            <div key={ci} className="text-xs text-gray-400">
                                              <span className="font-medium">{c.field}:</span> {String(c.previous ?? '—')} → {String(c.current ?? '—')}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              {selectedLeadDetails && (
                <div className="p-4 border-t border-gray-100 shrink-0">
                  <button
                    onClick={() => navigate(`/leads/${selectedLeadDetails._id}?type=property`)}
                    className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100"
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

export default PropertiesPage;
