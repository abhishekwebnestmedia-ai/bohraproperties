import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { RangeDatePicker } from '../common/RangeDatePicker';
import type { Dayjs } from 'dayjs';
import { useUsers } from '../../hooks/useUsers';

export interface FilterValues {
  search?: string;
  status?: string[];
  teamLead?: string[];
  rm?: string[];
  employee?: string[];
  transferTo?: string[];
  unassigned?: boolean;
  createdDateRange?: [Dayjs | null, Dayjs | null];
  followUpDateRange?: [Dayjs | null, Dayjs | null];
  sortBy?: string;
  order?: 'asc' | 'desc';
}

interface LeadFilterPanelProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  statusOptions: string[];
  type: 'property' | 'finance';
}

const LeadFilterPanel = ({ filters, onFiltersChange, statusOptions, type }: LeadFilterPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: usersData } = useUsers();
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    teamLead: false,
    rm: false,
    employee: false,
    transferTo: false,
    status: false,
  });

  // Filter users by role and domain
  const teamLeads = usersData?.users?.filter(u => u.role === 'teamlead' && u.domain === type) || [];
  const rms = usersData?.users?.filter(u => (u.role === 'employee' || u.role === 'teamlead') && u.domain === type) || [];
  const employees = usersData?.users?.filter(u => u.role === 'employee' && u.domain === type) || [];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCheckboxChange = (filterType: keyof FilterValues, value: string) => {
    const currentValues = (filters[filterType] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({ ...filters, [filterType]: newValues.length > 0 ? newValues : undefined });
  };

  const handleClearAll = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = Object.values(filters).filter(v => 
    v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
              {activeFiltersCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-gray-900"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name, email, location..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <button
              onClick={() => toggleSection('status')}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
            >
              <span>Status</span>
              {expandedSections.status ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.status && (
              <div className="space-y-2 pl-2">
                {statusOptions.map(status => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(filters.status || []).includes(status)}
                      onChange={() => handleCheckboxChange('status', status)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{status}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Team Lead */}
          <div>
            <button
              onClick={() => toggleSection('teamLead')}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
            >
              <span>Team Lead</span>
              {expandedSections.teamLead ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.teamLead && (
              <div className="space-y-2 pl-2 max-h-48 overflow-y-auto">
                {teamLeads.map(user => (
                  <label key={user._id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(filters.teamLead || []).includes(user.name)}
                      onChange={() => handleCheckboxChange('teamLead', user.name)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{user.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Relationship Manager */}
          <div>
            <button
              onClick={() => toggleSection('rm')}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
            >
              <span>Relationship Manager</span>
              {expandedSections.rm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.rm && (
              <div className="space-y-2 pl-2 max-h-48 overflow-y-auto">
                {rms.map(user => (
                  <label key={user._id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(filters.rm || []).includes(user.name)}
                      onChange={() => handleCheckboxChange('rm', user.name)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{user.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Employee */}
          <div>
            <button
              onClick={() => toggleSection('employee')}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
            >
              <span>Employee</span>
              {expandedSections.employee ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.employee && (
              <div className="space-y-2 pl-2 max-h-48 overflow-y-auto">
                {employees.map(user => (
                  <label key={user._id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(filters.employee || []).includes(user.name)}
                      onChange={() => handleCheckboxChange('employee', user.name)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{user.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Transfer To */}
          <div>
            <button
              onClick={() => toggleSection('transferTo')}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
            >
              <span>Transfer To</span>
              {expandedSections.transferTo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.transferTo && (
              <div className="space-y-2 pl-2 max-h-48 overflow-y-auto">
                {employees.map(user => (
                  <label key={user._id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(filters.transferTo || []).includes(user.name)}
                      onChange={() => handleCheckboxChange('transferTo', user.name)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{user.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Unassigned */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.unassigned || false}
                onChange={(e) => onFiltersChange({ ...filters, unassigned: e.target.checked || undefined })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Show Unassigned Only</span>
            </label>
          </div>

          {/* Created Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Created Date Range</label>
            <RangeDatePicker
              label="Created"
              value={filters.createdDateRange || [null, null]}
              onChange={(range) => onFiltersChange({ ...filters, createdDateRange: range })}
            />
          </div>

          {/* Follow-up Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Date Range</label>
            <RangeDatePicker
              label="Follow-up"
              value={filters.followUpDateRange || [null, null]}
              onChange={(range) => onFiltersChange({ ...filters, followUpDateRange: range })}
            />
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy || 'createdAt'}
                onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-blue-400"
              >
                <option value="createdAt">Created Date</option>
                <option value="followUpDate">Follow-up Date</option>
                <option value="clientName">Client Name</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <select
                value={filters.order || 'desc'}
                onChange={(e) => onFiltersChange({ ...filters, order: e.target.value as 'asc' | 'desc' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-blue-400"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadFilterPanel;
