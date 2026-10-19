import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import authService from "../../services/authService";
import EditUserModal from "../../components/modal/EditUserModal";
import RangeToggle from "../../components/common/RangeToggle";
import TaskPanel from "../../components/task/TaskPanel";
import { getCurrentUser } from "../../utils/auth";

type Range = "daily" | "weekly" | "monthly" | "yearly";

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const STATUS_COLORS: Record<string, string> = {
  "Follow up": "#3B82F6",
  Completed: "#10B981",
  Interested: "#8B5CF6",
  Busy: "#F59E0B",
  "Not Interested": "#EF4444",
  Dead: "#6B7280",
  Lead: "#06B6D4",
  Token: "#F97316",
};

function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? "#9CA3AF";
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function roleBadgeClass(role: string): string {
  const map: Record<string, string> = {
    superadmin: "bg-purple-100 text-purple-700",
    admin: "bg-blue-100 text-blue-700",
    teamlead: "bg-yellow-100 text-yellow-700",
    employee: "bg-gray-100 text-gray-700",
    operations: "bg-teal-100 text-teal-700",
  };
  return map[role?.toLowerCase()] ?? "bg-gray-100 text-gray-700";
}

interface SimpleStatCardProps {
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

const SimpleStatCard = ({ label, value, color, icon, onClick }: SimpleStatCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4 text-left transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
  >
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
    </div>
  </button>
);

const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [range, setRange] = useState<Range>("monthly");
  const [editOpen, setEditOpen] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const currentUser = getCurrentUser();
  const canManageTasks = ["ADMIN", "SUPERADMIN"].includes(currentUser.role);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["userDashboard", id, range],
    queryFn: () => authService.getUserDashboard(id!, range),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  const toggleApproval = useMutation({
    mutationFn: ({ isApproved }: { isApproved: boolean }) =>
      authService.toggleUserApproval(id!, isApproved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userDashboard", id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const user = data?.data?.user;
  const stats = data?.data?.stats;
  const performance = data?.data?.performance ?? [];
  const leadStatus = data?.data?.leadStatus ?? [];

  // Sort lead status by count descending
  const sortedLeadStatus = [...leadStatus].sort((a, b) => b.count - a.count);
  const maxCount = sortedLeadStatus[0]?.count || 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        Loading member profile…
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/team")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Team
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-sm text-red-600">
          Failed to load member profile. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate("/team")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Team
      </button>

      {/* Profile card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-blue-600">
                {user.name?.charAt(0).toUpperCase() ?? "?"}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadgeClass(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
                {user.domain && (
                  <span className="text-xs text-gray-400 capitalize">{user.domain}</span>
                )}
              </div>
            </div>
          </div>

        
          <div className="flex items-center gap-3">
            {canManageTasks && (
              <>
                <button
                  onClick={() => setShowTaskPanel(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Open task panel"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h6m-6 4h6m-6 4h6M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                  </svg>
                  Tasks
                </button>
                <div className="w-px h-5 bg-gray-200" />
              </>
            )}
           
            <button
              onClick={() => navigate(`/team/${id}/leads`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
              title="View leads for this member"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              View Leads
            </button>

            <div className="w-px h-5 bg-gray-200" />

            {/* Edit button */}
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
              title="Edit profile"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>

            <div className="w-px h-5 bg-gray-200" />

            <span className="text-sm text-gray-500">
              {user.isApproved ? "Active" : "Inactive"}
            </span>
            <button
              onClick={() =>
                toggleApproval.mutate({ isApproved: !user.isApproved })
              }
              disabled={toggleApproval.isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${
                user.isApproved ? "bg-green-500" : "bg-gray-300"
              } disabled:opacity-60`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  user.isApproved ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Info grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4 border-t border-gray-100 pt-5">
          {[
            { label: "Employee ID", value: user.employeeId },
            { label: "Phone", value: user.phoneNumber },
            { label: "Designation", value: user.designation },
            { label: "Reporting Manager", value: user.teamleadName },
            { label: "Created On", value: formatDate(user.createdAt) },
            { label: "Last Updated", value: formatDate(user.updatedAt) },
          ].map(({ label, value }) =>
            value ? (
              <div key={label}>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5 capitalize">{value}</p>
              </div>
            ) : null
          )}
        </div>

        {/* Permissions */}
        {user.permissions && Object.keys(user.permissions).length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Permissions</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(user.permissions).map(([key, enabled]) => (
                <span
                  key={key}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    enabled
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-400 line-through"
                  }`}
                >
                  {enabled ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit user modal */}
      <EditUserModal
        user={user}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
      />

      {canManageTasks && (
        <TaskPanel isOpen={showTaskPanel} onClose={() => setShowTaskPanel(false)} />
      )}

      {/* Range selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Performance Overview</h2>
        <RangeToggle
          options={RANGE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          activeValue={range}
          onChange={(v) => setRange(v as Range)}
        />
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SimpleStatCard
            label="Total Leads"
            value={stats.totalLeads.toLocaleString()}
            color="bg-blue-50"
            onClick={() => navigate(`/team/${id}/leads`)}
            icon={
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
          />
          <SimpleStatCard
            label="Active Deals"
            value={stats.activeDeals.toLocaleString()}
            color="bg-green-50"
            onClick={() => navigate(`/team/${id}/leads`)}
            icon={
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <SimpleStatCard
            label="Pending Tasks"
            value={stats.pendingTasks.toLocaleString()}
            color="bg-yellow-50"
            onClick={() => navigate(`/team/${id}/leads`)}
            icon={
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <SimpleStatCard
            label="Conversion Rate"
            value={stats.conversionRate}
            color="bg-purple-50"
            icon={
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            }
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance bar chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Leads vs Closed</h3>
          {performance.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">
              No performance data for this period.
            </div>
          ) : (
            <div style={{ height: 220, minHeight: 220 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={220}>
                <BarChart data={performance} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="_id"
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      border: "1px solid #E5E7EB",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="leads" name="Leads" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="closed" name="Closed" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Lead status breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Lead Status Breakdown</h3>
          {sortedLeadStatus.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">
              No lead status data for this period.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedLeadStatus.map((item) => (
                <div key={item._id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-28 shrink-0 truncate">{item._id}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.count / maxCount) * 100}%`,
                        backgroundColor: getStatusColor(item._id),
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-medium w-8 text-right shrink-0"
                    style={{ color: getStatusColor(item._id) }}
                  >
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
