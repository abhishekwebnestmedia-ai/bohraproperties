import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────────────────────
//  Types (matching the /history API response)
// ─────────────────────────────────────────────────────────────────────────────

interface HistoryChange {
  field: string;
  previous: unknown;
  current: unknown;
}

interface HistoryActivity {
  _id: string;
  action: string;
  type: string;
  icon: string;
  color: string;
  description: string;
  timestamp: string;
  createdAt: string;
  changes: HistoryChange[];
  ip: string;
  userAgent: string;
}

interface HistoryUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  employeeId?: string;
}

interface HistoryGroup {
  user: HistoryUser;
  activities: HistoryActivity[];
}

export interface LeadHistoryPanelProps {
  /** The lead / inventory item _id */
  id: string;
  /** API path prefix – maps to /fleads/:id/history, /pleads/:id/history, /inventory/:id/history */
  type: 'fleads' | 'pleads' | 'inventory';
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  clientName: 'Client Name',
  contactNumber: 'Contact',
  email: 'Email',
  loanRequirement: 'Loan Req.',
  location: 'Location',
  source: 'Source',
  followUpDate: 'Follow Up',
  status: 'Status',
  stage: 'Stage',
  notes: 'Notes',
  remarks: 'Remarks',
  reminderSent: 'Reminder Sent',
  createdBy: 'Created By',
  teamLead: 'Team Lead',
  relationshipManager: 'RM',
  transferTo: 'Transfer To',
  transferDate: 'Transfer Date',
  budget: 'Budget',
  project: 'Project',
  propertyType: 'Property Type',
};

const DOT_COLOR: Record<string, string> = {
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
};

const ACTION_BADGE: Record<string, string> = {
  CREATED: 'bg-green-50 text-green-700 border-green-200',
  UPDATED: 'bg-blue-50 text-blue-700 border-blue-200',
  DELETED: 'bg-red-50 text-red-700 border-red-200',
  TRANSFERRED: 'bg-purple-50 text-purple-700 border-purple-200',
};

function formatVal(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    if (obj.name) return String(obj.name);
    return JSON.stringify(val);
  }
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
    return dayjs(val).format('DD MMM YYYY, hh:mm A');
  }
  return String(val);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────────────────────

const LeadHistoryPanel = ({ id, type }: LeadHistoryPanelProps) => {
  const [history, setHistory] = useState<HistoryGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setFetchError(null);
    api
      .get(`/${type}/${id}/history`)
      .then((res) => {
        const data: HistoryGroup[] = res.data?.data ?? [];
        setHistory(data);
        // Auto-expand the first user group
        if (data.length > 0) {
          setExpandedUsers(new Set([data[0].user._id]));
        }
      })
      .catch((err) => {
        setFetchError(err?.response?.data?.message ?? 'Failed to load history');
      })
      .finally(() => setLoading(false));
  }, [id, type]);

  const toggleUser = (uid: string) =>
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });

  const toggleActivity = (aid: string) =>
    setExpandedActivities((prev) => {
      const next = new Set(prev);
      next.has(aid) ? next.delete(aid) : next.add(aid);
      return next;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return <p className="text-xs text-red-500 py-4 text-center">{fetchError}</p>;
  }

  if (history.length === 0) {
    return <p className="text-xs text-gray-400 py-4 text-center">No history available</p>;
  }

  return (
    <div className="space-y-2">
      {history.map((group) => {
        const isUserExpanded = expandedUsers.has(group.user._id);
        const initials = group.user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        return (
          <div
            key={group.user._id}
            className="border border-gray-100 rounded-lg overflow-hidden"
          >
            {/* ── User header ── */}
            <button
              onClick={() => toggleUser(group.user._id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <span className="flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex-shrink-0">
                {initials}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{group.user.name}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {group.user.role} · {group.activities.length}{' '}
                  {group.activities.length === 1 ? 'activity' : 'activities'}
                </p>
              </div>
              {isUserExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {/* ── Activity list ── */}
            {isUserExpanded && (
              <div className="divide-y divide-gray-100">
                {group.activities.map((activity) => {
                  const isActivityExpanded = expandedActivities.has(activity._id);
                  const meaningfulChanges = activity.changes.filter(
                    (c) => String(c.previous) !== String(c.current)
                  );

                  return (
                    <div key={activity._id} className="bg-white">
                      <button
                        onClick={() => toggleActivity(activity._id)}
                        className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                      >
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${DOT_COLOR[activity.color] ?? 'bg-gray-400'}`}
                        />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded border ${
                                ACTION_BADGE[activity.action] ??
                                'bg-gray-100 text-gray-700 border-gray-200'
                              }`}
                            >
                              {activity.type}
                            </span>
                            <span className="text-xs text-gray-600 truncate">
                              {activity.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-[11px] text-gray-400">
                              {activity.timestamp}
                            </span>
                          </div>
                        </div>
                        {meaningfulChanges.length > 0 &&
                          (isActivityExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-1" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-1" />
                          ))}
                      </button>

                      {/* ── Changes table ── */}
                      {isActivityExpanded && meaningfulChanges.length > 0 && (
                        <div className="mx-3 mb-2.5 border border-gray-100 rounded-lg overflow-hidden text-xs">
                          <div className="grid grid-cols-3 bg-gray-50 px-2 py-1.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">
                            <span>Field</span>
                            <span>Before</span>
                            <span>After</span>
                          </div>
                          {meaningfulChanges.map((change, i) => (
                            <div
                              key={i}
                              className={`grid grid-cols-3 px-2 py-1.5 ${
                                i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'
                              }`}
                            >
                              <span className="text-gray-600 truncate">
                                {FIELD_LABELS[change.field] ?? change.field}
                              </span>
                              <span className="text-red-600 truncate">
                                {formatVal(change.previous)}
                              </span>
                              <span className="text-green-700 truncate">
                                {formatVal(change.current)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LeadHistoryPanel;
