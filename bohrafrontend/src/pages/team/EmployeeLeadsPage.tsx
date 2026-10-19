import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { MoreVertical, Search } from 'lucide-react';
import authService from '../../services/authService';
import ToggleButton from '../../components/common/ToggleButton';
import FilterWidgetMenu, { type FilterSection } from '../../components/common/FilterWidgetMenu';
import { usePropertyLeads } from '../../hooks/usePropertyLeads';
import { useFinanceLeads } from '../../hooks/useFinanceLeads';
import type { GetPropertyLeadsParams } from '../../services/propertyLeadsService';
import type { GetFinanceLeadsParams } from '../../services/financeLeadsService';

type Domain = 'property' | 'finance';

const EmployeeLeadsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Leads');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [createdDateFrom, setCreatedDateFrom] = useState('');
  const [createdDateTo, setCreatedDateTo] = useState('');
  const [followUpDateFrom, setFollowUpDateFrom] = useState('');
  const [followUpDateTo, setFollowUpDateTo] = useState('');

  // Fetch user info to get the exact user id for RM-based lead filtering.
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['userDashboard', id, 'monthly'],
    queryFn: () => authService.getUserDashboard(id!, 'monthly'),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  const user = userData?.data?.user;
  const rmId = user?._id;
  const normalizedDomain = (user?.domain ?? '').toLowerCase().trim();
  const domain: Domain = normalizedDomain === 'finance' ? 'finance' : 'property';
  const hasSupportedDomain = normalizedDomain === 'property' || normalizedDomain === 'finance';

  const tabOptions = useMemo(
    () => (
      domain === 'property'
        ? [
            { value: 'Leads', label: 'Leads' },
            { value: 'Token', label: 'Token' },
            { value: 'Completed', label: 'Completed' },
            { value: 'Dead', label: 'Dead' },
          ]
        : [
            { value: 'Leads', label: 'Leads' },
            { value: 'login', label: 'Login' },
            { value: 'Dead', label: 'Dead' },
          ]
    ),
    [domain]
  );

  const filterSections: FilterSection[] = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      items: domain === 'property'
        ? ['Follow up', 'Interested', 'Busy']
        : ['Follow up', 'Interested', 'Busy', 'Dead', 'Closed'],
    },
    { key: 'date', label: 'Created Date', items: [] },
    { key: 'followup', label: 'Follow Up Date', items: [] },
  ], [domain]);

  const activeFilterCount =
    selectedStatuses.length +
    (createdDateFrom || createdDateTo ? 1 : 0) +
    (followUpDateFrom || followUpDateTo ? 1 : 0);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, selectedStatuses, createdDateFrom, createdDateTo, followUpDateFrom, followUpDateTo]);

  const handleFilterToggle = (sectionKey: string, value: string) => {
    if (sectionKey !== 'status') return;
    setSelectedStatuses((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleDateChange = (rangeKey: string, field: 'from' | 'to', value: string) => {
    if (rangeKey === 'date') {
      field === 'from' ? setCreatedDateFrom(value) : setCreatedDateTo(value);
      return;
    }
    if (rangeKey === 'followup') {
      field === 'from' ? setFollowUpDateFrom(value) : setFollowUpDateTo(value);
    }
  };

  const handleClearAllFilters = () => {
    setSelectedStatuses([]);
    setCreatedDateFrom('');
    setCreatedDateTo('');
    setFollowUpDateFrom('');
    setFollowUpDateTo('');
  };

  const propertyParams: GetPropertyLeadsParams = rmId
    ? {
        rm: rmId,
        page,
        limit: 20,
        status: activeTab,
        search: searchQuery || undefined,
        activityStatus: selectedStatuses.length > 0 ? selectedStatuses.join(',') : undefined,
        from: createdDateFrom ? `${createdDateFrom}T00:00:00+05:30` : undefined,
        to: createdDateTo ? `${createdDateTo}T23:59:59.999+05:30` : undefined,
        followFrom: followUpDateFrom ? `${followUpDateFrom}T00:00:00+05:30` : undefined,
        followTo: followUpDateTo ? `${followUpDateTo}T23:59:59.999+05:30` : undefined,
      }
    : { page: 1, limit: 1 };

  const financeParams: GetFinanceLeadsParams = rmId
    ? {
        rm: rmId,
        page,
        limit: 20,
        status: activeTab,
        search: searchQuery || undefined,
        activityStatus: selectedStatuses.length > 0 ? selectedStatuses.join(',') : undefined,
        from: createdDateFrom ? `${createdDateFrom}T00:00:00+05:30` : undefined,
        to: createdDateTo ? `${createdDateTo}T23:59:59.999+05:30` : undefined,
        followFrom: followUpDateFrom ? `${followUpDateFrom}T00:00:00+05:30` : undefined,
        followTo: followUpDateTo ? `${followUpDateTo}T23:59:59.999+05:30` : undefined,
      }
    : { page: 1, limit: 1 };

  const { data: propertyLeads, isLoading: propLoading, error: propError } = usePropertyLeads(
    domain === 'property' ? propertyParams : { page: 1, limit: 1 }
  );
  const { data: financeLeads, isLoading: finLoading, error: finError } = useFinanceLeads(
    domain === 'finance' ? financeParams : { page: 1, limit: 1 }
  );

  const leads = domain === 'property'
    ? (propertyLeads?.data ?? [])
    : (financeLeads?.data ?? []);

  const meta = domain === 'property' ? propertyLeads?.meta : financeLeads?.meta;
  const error = domain === 'property' ? propError : finError;
  const isLoading = userLoading || (domain === 'property' ? propLoading : finLoading);
  const totalPages = meta?.totalPages || 1;

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(`/team/${id}`)}
        className="flex items-center gap-2 text-sm text-gray-500 btn-hover"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Profile
      </button>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user?.name ?? '—'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Leads where this member is the Relationship Manager
          </p>
        </div>
{/* 
        <div className="flex items-center gap-3 flex-wrap">
          {hasSupportedDomain && (
            <span className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full capitalize">
              {domain} Leads
            </span>
          )}
        </div> */}
      </div>

      {/* Filters / Tabs / Search */}
      <div className="p-4 py-2 bg-gray-100 rounded-lg">
        <div className="flex items-center gap-3 flex-wrap">
          <FilterWidgetMenu
            sections={filterSections}
            selected={{ status: selectedStatuses }}
            onToggle={handleFilterToggle}
            dateRanges={{
              date: { from: createdDateFrom, to: createdDateTo },
              followup: { from: followUpDateFrom, to: followUpDateTo },
            }}
            onDateChange={handleDateChange}
            onClearAll={handleClearAllFilters}
            activeCount={activeFilterCount}
          />

          {hasSupportedDomain && (
            <ToggleButton options={tabOptions} activeValue={activeTab} onChange={setActiveTab} />
          )}

          <div className="flex-1" />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search by name, contact…"
              className="pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-200 w-56"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 leading-none text-base"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex flex-col overflow-hidden bg-white border border-gray-200 rounded-lg max-h-[70vh]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Client Name</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Contact Number</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Email</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">{domain === 'property' ? 'Budget' : 'Loan Requirement'}</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Location</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Projects</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Team Lead</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Relationship Manager</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Source</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Date</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Follow Up Date</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Status</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Notes</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Remarks</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={15} className="px-6 py-12 text-sm text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full border-t-gray-700 animate-spin" />
                      Loading leads…
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={15} className="px-6 py-12 text-sm text-center text-red-500">
                    Error loading leads: {error instanceof Error ? error.message : 'Unknown error'}
                  </td>
                </tr>
              ) : !hasSupportedDomain ? (
                <tr>
                  <td colSpan={15} className="px-6 py-12 text-sm text-center text-gray-400">
                    Member domain is not set to Property or Finance.
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-6 py-12 text-sm text-center text-gray-400">
                    No {domain} leads assigned to this member
                  </td>
                </tr>
              ) : (
                leads.map((lead: any) => (
                  <tr key={lead.id || lead._id} className="group transition-colors hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {lead.clientName || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {lead.contactNumber || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {lead.email || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {domain === 'property' ? (lead.budget || '—') : (lead.loanRequirement || '—')}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {lead.location || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {lead.project || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {lead.teamLead?.name || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {lead.relationshipManager?.name || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className="text-gray-700">{lead.source || '—'}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {lead.createdAt ? dayjs(lead.createdAt).format('DD MMM YYYY') : '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {lead.followUpDate ? dayjs(lead.followUpDate).format('DD MMM YYYY, hh:mm A') : '—'}
                    </td>
                    <td className="px-6 py-3 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          lead.status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : lead.status === 'Dead'
                              ? 'bg-red-100 text-red-800'
                              : lead.status === 'Login'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {lead.status || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {lead.notes || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {lead.remarks || '—'}
                    </td>
                    <td className="w-10 px-2 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/leads/${lead._id}?type=${domain}`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                        title="View / Edit lead"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.total > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {meta.total === 0
                ? 'No leads'
                : `Showing ${((page - 1) * meta.limit) + 1}–${Math.min(page * meta.limit, meta.total)} of ${meta.total}`}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-gray-600 rounded disabled:opacity-40 btn-hover"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="px-2 text-xs text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 text-gray-600 rounded disabled:opacity-40 btn-hover"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeLeadsPage;
