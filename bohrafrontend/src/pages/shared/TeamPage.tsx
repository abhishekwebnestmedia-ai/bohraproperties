import { Fragment, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AddMemberModal, { type AddMemberStep1Data } from "../../components/modal/AddMemberModal";
import MemberDetailsModal from "../../components/modal/MemberDetailsModal";
import { getCurrentUser } from "../../utils/auth";
import { useUsers } from "../../hooks/useUsers";
import authService from "../../services/authService";

const ROWS_PER_PAGE = 10;

type TeamLeadNode = {
  lead: {
    _id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    domain?: string;
    isApproved?: boolean;
    createdBy?: string;
    updatedAt?: string;
  };
  employees: Array<{
    _id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    domain?: string;
    employeeId?: string;
    teamleadName?: string;
    reportingManager?: string;
    reportingManagerName?: string;
    isApproved?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }>;
};

type AdminNode = {
  admin: {
    _id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    domain?: string;
    isApproved?: boolean;
    createdBy?: string;
    updatedAt?: string;
  };
  teamLeads: TeamLeadNode[];
};

type SuperAdminNode = {
  superadmin: {
    _id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    domain?: string;
    isApproved?: boolean;
    createdBy?: string;
    updatedAt?: string;
  };
  admins: AdminNode[];
};

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeKey(value?: string): string {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "");
}

function getManagerKeys(user: {
  teamleadName?: string;
  reportingManager?: string;
  reportingManagerName?: string;
}): string[] {
  return [user.teamleadName, user.reportingManager, user.reportingManagerName]
    .map((v) => normalizeKey(v))
    .filter(Boolean);
}

const TeamPage = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [addDetailsOpen, setAddDetailsOpen] = useState(false);
  const [step1Data, setStep1Data] = useState<AddMemberStep1Data>({
    domain: "property",
    designation: "employee",
    notes: "",
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Record<string, boolean>>({});
  const currentUser = getCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useUsers();

  const toggleApprovalMutation = useMutation({
    mutationFn: ({ userId, isApproved }: { userId: string; isApproved: boolean }) =>
      authService.toggleUserApproval(userId, isApproved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const role = currentUser.role?.toLowerCase();
  const isHierarchyView = ["superadmin", "admin", "teamlead"].includes(role);

  const users = useMemo(() => {
    const role = currentUser.role?.toLowerCase();
    let list = data?.users ?? [];

    // Mirror backend visibility rules on the client as an extra guard.
    if (role === "employee") {
      list = list.filter(
        (u) =>
          u.role?.toLowerCase() === "employee" &&
          (!currentUser.domain || (u.domain || "").toLowerCase() === currentUser.domain.toLowerCase())
      );
    }

    if (isHierarchyView) return list;

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phoneNumber?.includes(q) ||
        u.employeeId?.toLowerCase().includes(q) ||
        u.teamleadName?.toLowerCase().includes(q) ||
        u.reportingManager?.toLowerCase().includes(q) ||
        u.reportingManagerName?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    );
  }, [data, search, currentUser.role, currentUser.domain, isHierarchyView]);

  const hierarchicalTeams = useMemo<SuperAdminNode[]>(() => {
    if (!isHierarchyView) return [];

    const q = search.trim().toLowerCase();
    const currentLeadName = currentUser.name || "Team Lead";
    const currentLeadId = currentUser.id || "self-teamlead";
    const currentLeadNameNorm = normalizeKey(currentLeadName);

    if (role === "teamlead") {
      const selfUser = users.find(
        (u) =>
          (currentUser.id && u._id === currentUser.id) ||
          (!!currentUser.email && u.email === currentUser.email) ||
          normalizeKey(u.name) === currentLeadNameNorm
      );

      const allEmployees = users
        .filter((u) => u.role?.toLowerCase() === "employee")
        .filter((u) => !currentUser.domain || (u.domain || "").toLowerCase() === String(currentUser.domain).toLowerCase());

      const directEmployees = allEmployees.filter((employee) => {
        const managerKeys = getManagerKeys(employee);
        const byManagerName = managerKeys.some((k) => k === currentLeadNameNorm);
        const byCreatedBy = !!employee.createdBy && String(employee.createdBy) === String(currentUser.id);
        return byManagerName || byCreatedBy;
      });

      const teamEmployees = directEmployees;

      const matches = (value?: string) => (value || "").toLowerCase().includes(q);
      const filteredEmployees = !q
        ? teamEmployees
        : teamEmployees.filter(
            (employee) =>
              matches(employee.name) ||
              matches(employee.email) ||
              matches(employee.phoneNumber) ||
              matches(employee.employeeId)
          );

      const admin = selfUser?.createdBy
        ? users.find((u) => u._id === selfUser.createdBy)
        : users.find((u) => u.role?.toLowerCase() === "admin");
      const superadmin = admin?.createdBy
        ? users.find((u) => u._id === admin.createdBy)
        : users.find((u) => u.role?.toLowerCase() === "superadmin");

      const leadMatch =
        matches(currentLeadName) ||
        matches(currentUser.email) ||
        matches(currentUser.phoneNumber) ||
        matches(currentUser.domain);

      if (q && !leadMatch && filteredEmployees.length === 0) {
        return [];
      }

      return [
        {
          superadmin: {
            _id: superadmin?._id || "fallback-superadmin",
            name: superadmin?.name || "Super Admin",
            email: superadmin?.email,
            phoneNumber: superadmin?.phoneNumber,
            domain: superadmin?.domain || currentUser.domain,
            isApproved: superadmin?.isApproved,
            createdBy: superadmin?.createdBy,
            updatedAt: superadmin?.updatedAt,
          },
          admins: [
            {
              admin: {
                _id: admin?._id || "fallback-admin",
                name: admin?.name || "Admin",
                email: admin?.email,
                phoneNumber: admin?.phoneNumber,
                domain: admin?.domain || currentUser.domain,
                isApproved: admin?.isApproved,
                createdBy: admin?.createdBy,
                updatedAt: admin?.updatedAt,
              },
              teamLeads: [
                {
                  lead: {
                    _id: String(currentLeadId),
                    name: currentLeadName,
                    email: currentUser.email,
                    phoneNumber: currentUser.phoneNumber,
                    domain: currentUser.domain,
                  },
                  employees: filteredEmployees.map((employee) => ({
                    _id: employee._id,
                    name: employee.name,
                    email: employee.email,
                    phoneNumber: employee.phoneNumber,
                    domain: employee.domain,
                    employeeId: employee.employeeId,
                    teamleadName: employee.teamleadName,
                    reportingManager: employee.reportingManager,
                    reportingManagerName: employee.reportingManagerName,
                    isApproved: employee.isApproved,
                    createdAt: employee.createdAt,
                    updatedAt: employee.updatedAt,
                  })),
                },
              ],
            },
          ],
        },
      ];
    }

    const superAdmins = users
      .filter((u) => u.role?.toLowerCase() === "superadmin")
      .sort((a, b) => a.name.localeCompare(b.name));
    const admins = users
      .filter((u) => u.role?.toLowerCase() === "admin")
      .sort((a, b) => a.name.localeCompare(b.name));
    const teamLeads = users
      .filter(
      (u) => u.role?.toLowerCase() === "teamlead" || u.designation?.toLowerCase() === "teamlead"
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    const employees = users
      .filter((u) => u.role?.toLowerCase() === "employee")
      .sort((a, b) => a.name.localeCompare(b.name));

    const superadminNodes: SuperAdminNode[] = superAdmins.map((sa) => ({
      superadmin: {
        _id: sa._id,
        name: sa.name,
        email: sa.email,
        phoneNumber: sa.phoneNumber,
        domain: sa.domain,
        isApproved: sa.isApproved,
        createdBy: sa.createdBy,
        updatedAt: sa.updatedAt,
      },
      admins: [],
    }));

    const adminNodes = admins.map<AdminNode>((admin) => ({
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
        domain: admin.domain,
        isApproved: admin.isApproved,
        createdBy: admin.createdBy,
        updatedAt: admin.updatedAt,
      },
      teamLeads: [],
    }));

    const superadminMap = new Map(superadminNodes.map((n) => [n.superadmin._id, n]));
    const fallbackSuperadmin = superadminNodes[0];
    adminNodes.forEach((adminNode) => {
      const ownerSuperadminId = adminNode.admin.createdBy;
      if (ownerSuperadminId && superadminMap.has(ownerSuperadminId)) {
        superadminMap.get(ownerSuperadminId)?.admins.push(adminNode);
        return;
      }

      // Keep the hierarchy intact even for legacy records with missing createdBy.
      if (fallbackSuperadmin) {
        fallbackSuperadmin.admins.push(adminNode);
      }
    });

    const adminMap = new Map<string, AdminNode>();
    superadminNodes.forEach((node) => {
      node.admins.forEach((adminNode) => {
        adminMap.set(adminNode.admin._id, adminNode);
      });
    });

    const teamLeadMap = new Map<string, TeamLeadNode>();
    const teamLeadAliases = new Map<string, string>();

    const fallbackAdmin = adminNodes[0];
    teamLeads.forEach((lead) => {
      const leadNode: TeamLeadNode = {
        lead: {
          _id: lead._id,
          name: lead.name,
          email: lead.email,
          phoneNumber: lead.phoneNumber,
          domain: lead.domain,
          isApproved: lead.isApproved,
          createdBy: lead.createdBy,
          updatedAt: lead.updatedAt,
        },
        employees: [],
      };

      teamLeadMap.set(lead._id, leadNode);
      const normalizedName = normalizeKey(lead.name);
      if (normalizedName) teamLeadAliases.set(normalizedName, lead._id);
      const normalizedEmployeeId = normalizeKey(lead.employeeId);
      if (normalizedEmployeeId) teamLeadAliases.set(normalizedEmployeeId, lead._id);

      const ownerAdminId = lead.createdBy;
      if (ownerAdminId && adminMap.has(ownerAdminId)) {
        adminMap.get(ownerAdminId)?.teamLeads.push(leadNode);
        return;
      }

      if (fallbackAdmin) {
        fallbackAdmin.teamLeads.push(leadNode);
      }
    });

    employees.forEach((employee) => {
      const managerKeys = getManagerKeys(employee);
      let matchedLeadId = managerKeys
        .map((key) => teamLeadAliases.get(key))
        .find((id): id is string => !!id);

      if (!matchedLeadId && managerKeys.length) {
        const aliasEntries = Array.from(teamLeadAliases.entries());
        matchedLeadId = managerKeys
          .flatMap((managerKey) =>
            aliasEntries
              .filter(([aliasKey]) => aliasKey.includes(managerKey) || managerKey.includes(aliasKey))
              .map(([, leadId]) => leadId)
          )
          .find((id): id is string => !!id);
      }

      if (!matchedLeadId && employee.createdBy && teamLeadMap.has(employee.createdBy)) {
        matchedLeadId = employee.createdBy;
      }

      if (!matchedLeadId) return;

      const leadNode = teamLeadMap.get(matchedLeadId);
      if (!leadNode) return;

      leadNode.employees.push({
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
        domain: employee.domain,
        employeeId: employee.employeeId,
        teamleadName: employee.teamleadName,
        reportingManager: employee.reportingManager,
        reportingManagerName: employee.reportingManagerName,
        isApproved: employee.isApproved,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
      });
    });

    const matches = (value?: string) => (value || "").toLowerCase().includes(q);

    if (!q) return superadminNodes;

    return superadminNodes
      .map((superadminNode) => {
        const superadminMatch =
          matches(superadminNode.superadmin.name) ||
          matches(superadminNode.superadmin.email) ||
          matches(superadminNode.superadmin.phoneNumber) ||
          matches(superadminNode.superadmin.domain);

        const matchedAdmins = superadminNode.admins
          .map((adminNode) => {
            const adminMatch =
              matches(adminNode.admin.name) ||
              matches(adminNode.admin.email) ||
              matches(adminNode.admin.phoneNumber) ||
              matches(adminNode.admin.domain);

            const matchedTeamLeads = adminNode.teamLeads.filter(
              (teamLeadNode) => {
                const teamLeadMatch =
                  matches(teamLeadNode.lead.name) ||
                  matches(teamLeadNode.lead.email) ||
                  matches(teamLeadNode.lead.phoneNumber) ||
                  matches(teamLeadNode.lead.domain);

                const matchedEmployees = teamLeadNode.employees.filter(
                  (employee) =>
                    matches(employee.name) ||
                    matches(employee.email) ||
                    matches(employee.phoneNumber) ||
                    matches(employee.employeeId)
                );

                if (teamLeadMatch) return true;

                if (matchedEmployees.length) {
                  teamLeadNode.employees = matchedEmployees;
                  return true;
                }

                return false;
              }
            );

            if (adminMatch) return adminNode;
            if (!matchedTeamLeads.length) return null;

            return {
              ...adminNode,
              teamLeads: matchedTeamLeads,
            };
          })
          .filter((item): item is AdminNode => !!item);

        if (superadminMatch) return superadminNode;
        if (!matchedAdmins.length) return null;

        return {
          ...superadminNode,
          admins: matchedAdmins,
        };
      })
      .filter((item): item is SuperAdminNode => !!item);
  }, [users, isHierarchyView, search, role, currentUser.name, currentUser.id, currentUser.email, currentUser.phoneNumber, currentUser.domain]);

  const totalPages = Math.max(
    1,
    Math.ceil((isHierarchyView ? hierarchicalTeams.length : users.length) / ROWS_PER_PAGE)
  );
  const paginated = users.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  const paginatedHierarchy = hierarchicalTeams.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const toggleNodeExpand = (nodeKey: string) => {
    setExpandedNodeIds((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  };

  const superAdminCount = hierarchicalTeams.length;
  const adminCount = hierarchicalTeams.reduce((acc, node) => acc + node.admins.length, 0);
  const teamLeadCount = hierarchicalTeams.reduce(
    (acc, node) => acc + node.admins.reduce((inner, adminNode) => inner + adminNode.teamLeads.length, 0),
    0
  );
  const employeeCount = hierarchicalTeams.reduce(
    (acc, node) =>
      acc +
      node.admins.reduce(
        (adminAcc, adminNode) =>
          adminAcc + adminNode.teamLeads.reduce((teamLeadAcc, tl) => teamLeadAcc + tl.employees.length, 0),
        0
      ),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isHierarchyView 
              ? "Manage your organization: Super Admins, Admins, Team Leads, and Employees"
              : "Manage your team members and their permissions."}
          </p>
        </div>
        {["superadmin", "admin"].includes(currentUser.role?.toLowerCase()) && (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <span>Add Member</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {/* Search + count bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <svg
            className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M16.65 10.5A6.15 6.15 0 1 1 4.35 10.5a6.15 6.15 0 0 1 12.3 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, email, role…"
            className="w-full py-2 pr-4 text-sm border border-gray-200 rounded-lg pl-9 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <span className="text-sm text-gray-500 shrink-0">
          {isHierarchyView
            ? `${superAdminCount} super admin${superAdminCount !== 1 ? "s" : ""} • ${adminCount} admin${adminCount !== 1 ? "s" : ""} • ${teamLeadCount} team lead${teamLeadCount !== 1 ? "s" : ""} • ${employeeCount} employee${employeeCount !== 1 ? "s" : ""}`
            : `${users.length} member${users.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-500">
            Loading team members…
          </div>
        ) : isError && !users.length ? (
          <div className="flex items-center justify-center py-16 text-sm text-red-500">
            Failed to load team members. Please try again.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {isHierarchyView ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Team", "Contact", "Email", "Domain", "Status", "Last Updated"].map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedHierarchy.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-sm text-center text-gray-500">
                        {search ? "No hierarchy nodes match your search." : "No hierarchy data found."}
                      </td>
                    </tr>
                  ) : (
                    paginatedHierarchy.map((superadminNode) => {
                      const superadminKey = `superadmin:${superadminNode.superadmin._id}`;
                      const isSuperadminExpanded = expandedNodeIds[superadminKey] ?? true;

                      return (
                        <Fragment key={superadminNode.superadmin._id}>
                          <tr
                            className="transition-colors cursor-pointer bg-purple-50/50 hover:bg-purple-50"
                            onDoubleClick={() => navigate(`/team/${superadminNode.superadmin._id}`)}
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (superadminNode.admins.length) toggleNodeExpand(superadminKey);
                                }}
                                className="flex items-center gap-2"
                                title={superadminNode.admins.length ? (isSuperadminExpanded ? "Hide admins" : "Show admins") : "No admins"}
                                disabled={!superadminNode.admins.length}
                              >
                                {superadminNode.admins.length ? (
                                  <svg
                                    className={`w-4 h-4 text-gray-500 transition-transform ${isSuperadminExpanded ? "rotate-90" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                ) : (
                                  <div className="w-4" />
                                )}
                                <div className="flex items-center gap-3 text-left">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 shrink-0">
                                    <span className="text-xs font-semibold text-purple-700">
                                      {superadminNode.superadmin.name?.charAt(0).toUpperCase() ?? "?"}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{superadminNode.superadmin.name}</p>
                                    <p className="text-xs text-gray-500">
                                      Super Admin • {superadminNode.admins.length} admin{superadminNode.admins.length !== 1 ? "s" : ""}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">{superadminNode.superadmin.phoneNumber ?? "—"}</td>
                            <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">{superadminNode.superadmin.email ?? "—"}</td>
                            <td className="px-4 py-4 text-sm text-gray-700 capitalize whitespace-nowrap">{superadminNode.superadmin.domain ?? "—"}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleApprovalMutation.mutate({
                                    userId: superadminNode.superadmin._id,
                                    isApproved: !superadminNode.superadmin.isApproved,
                                  });
                                }}
                                disabled={toggleApprovalMutation.isPending}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${
                                  superadminNode.superadmin.isApproved ? "bg-green-500" : "bg-gray-300"
                                } disabled:opacity-60`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                    superadminNode.superadmin.isApproved ? "translate-x-6" : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(superadminNode.superadmin.updatedAt)}</td>
                          </tr>

                          {isSuperadminExpanded &&
                            superadminNode.admins.map((adminNode) => {
                              const adminKey = `admin:${adminNode.admin._id}`;
                              const isAdminExpanded = expandedNodeIds[adminKey] ?? true;

                              return (
                                <Fragment key={adminNode.admin._id}>
                                  <tr
                                    className="transition-colors cursor-pointer bg-cyan-50/40 hover:bg-cyan-50"
                                    onDoubleClick={() => navigate(`/team/${adminNode.admin._id}`)}
                                  >
                                    <td className="py-3 pl-12 pr-4 whitespace-nowrap">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (adminNode.teamLeads.length) toggleNodeExpand(adminKey);
                                        }}
                                        className="flex items-center gap-2"
                                        title={adminNode.teamLeads.length ? (isAdminExpanded ? "Hide team leads" : "Show team leads") : "No team leads"}
                                        disabled={!adminNode.teamLeads.length}
                                      >
                                        {adminNode.teamLeads.length ? (
                                          <svg
                                            className={`w-4 h-4 text-gray-500 transition-transform ${isAdminExpanded ? "rotate-90" : ""}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                          </svg>
                                        ) : (
                                          <div className="w-4" />
                                        )}
                                        <div className="flex items-center gap-3 text-left">
                                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-cyan-100 shrink-0">
                                            <span className="text-xs font-semibold text-cyan-700">
                                              {adminNode.admin.name?.charAt(0).toUpperCase() ?? "?"}
                                            </span>
                                          </div>
                                          <div>
                                            <p className="text-sm font-semibold text-gray-900">{adminNode.admin.name}</p>
                                            <p className="text-xs text-gray-500">
                                              Admin • {adminNode.teamLeads.length} team lead{adminNode.teamLeads.length !== 1 ? "s" : ""}
                                            </p>
                                          </div>
                                        </div>
                                      </button>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{adminNode.admin.phoneNumber ?? "—"}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{adminNode.admin.email ?? "—"}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700 capitalize whitespace-nowrap">{adminNode.admin.domain ?? "—"}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleApprovalMutation.mutate({
                                            userId: adminNode.admin._id,
                                            isApproved: !adminNode.admin.isApproved,
                                          });
                                        }}
                                        disabled={toggleApprovalMutation.isPending}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${
                                          adminNode.admin.isApproved ? "bg-green-500" : "bg-gray-300"
                                        } disabled:opacity-60`}
                                      >
                                        <span
                                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                            adminNode.admin.isApproved ? "translate-x-6" : "translate-x-1"
                                          }`}
                                        />
                                      </button>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(adminNode.admin.updatedAt)}</td>
                                  </tr>

                                  {isAdminExpanded &&
                                    (adminNode.teamLeads.length ? (
                                      adminNode.teamLeads.map((teamLeadNode) => {
                                        const teamLeadKey = `teamlead:${teamLeadNode.lead._id}`;
                                        const isTeamLeadExpanded = expandedNodeIds[teamLeadKey] ?? true;

                                        return (
                                          <Fragment key={teamLeadNode.lead._id}>
                                            <tr
                                              className="transition-colors cursor-pointer hover:bg-gray-50"
                                              onDoubleClick={() => navigate(`/team/${teamLeadNode.lead._id}`)}
                                            >
                                              <td className="py-3 pl-20 pr-4 whitespace-nowrap">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (teamLeadNode.employees.length) toggleNodeExpand(teamLeadKey);
                                                  }}
                                                  className="flex items-center gap-2"
                                                  title={teamLeadNode.employees.length ? (isTeamLeadExpanded ? "Hide employees" : "Show employees") : "No employees"}
                                                  disabled={!teamLeadNode.employees.length}
                                                >
                                                  {teamLeadNode.employees.length ? (
                                                    <svg
                                                      className={`w-4 h-4 text-gray-500 transition-transform ${isTeamLeadExpanded ? "rotate-90" : ""}`}
                                                      fill="none"
                                                      stroke="currentColor"
                                                      viewBox="0 0 24 24"
                                                    >
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                  ) : (
                                                    <div className="w-4" />
                                                  )}
                                                  <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-7 h-7 bg-blue-100 rounded-full shrink-0">
                                                      <span className="text-xs font-semibold text-blue-700">
                                                        {teamLeadNode.lead.name?.charAt(0).toUpperCase() ?? "?"}
                                                      </span>
                                                    </div>
                                                    <div className="text-left">
                                                      <p className="text-sm font-medium text-gray-900">{teamLeadNode.lead.name}</p>
                                                      <p className="text-xs text-gray-500">
                                                        Team Lead • {teamLeadNode.employees.length} employee{teamLeadNode.employees.length !== 1 ? "s" : ""}
                                                      </p>
                                                    </div>
                                                  </div>
                                                </button>
                                              </td>
                                              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{teamLeadNode.lead.phoneNumber ?? "—"}</td>
                                              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{teamLeadNode.lead.email ?? "—"}</td>
                                              <td className="px-4 py-3 text-sm text-gray-700 capitalize whitespace-nowrap">{teamLeadNode.lead.domain ?? "—"}</td>
                                              <td className="px-4 py-3 whitespace-nowrap">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleApprovalMutation.mutate({
                                                      userId: teamLeadNode.lead._id,
                                                      isApproved: !teamLeadNode.lead.isApproved,
                                                    });
                                                  }}
                                                  disabled={toggleApprovalMutation.isPending}
                                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${
                                                    teamLeadNode.lead.isApproved ? "bg-green-500" : "bg-gray-300"
                                                  } disabled:opacity-60`}
                                                >
                                                  <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                                      teamLeadNode.lead.isApproved ? "translate-x-6" : "translate-x-1"
                                                    }`}
                                                  />
                                                </button>
                                              </td>
                                              <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(teamLeadNode.lead.updatedAt)}</td>
                                            </tr>

                                            {isTeamLeadExpanded &&
                                              (teamLeadNode.employees.length ? (
                                                teamLeadNode.employees.map((employee) => (
                                                  <tr
                                                    key={employee._id}
                                                    className="transition-colors cursor-pointer hover:bg-slate-50"
                                                    onDoubleClick={() => navigate(`/team/${employee._id}`)}
                                                  >
                                                    <td className="py-3 pl-28 pr-4 whitespace-nowrap">
                                                      <div className="flex items-center gap-3">
                                                        <div className="flex items-center justify-center w-7 h-7 bg-gray-100 rounded-full shrink-0">
                                                          <span className="text-xs font-semibold text-gray-700">
                                                            {employee.name?.charAt(0).toUpperCase() ?? "?"}
                                                          </span>
                                                        </div>
                                                        <div>
                                                          <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                                                          <p className="text-xs text-gray-500">
                                                            Employee{employee.employeeId ? ` • ${employee.employeeId}` : ""}
                                                          </p>
                                                        </div>
                                                      </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{employee.phoneNumber ?? "—"}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{employee.email ?? "—"}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700 capitalize whitespace-nowrap">{employee.domain ?? "—"}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          toggleApprovalMutation.mutate({
                                                            userId: employee._id,
                                                            isApproved: !employee.isApproved,
                                                          });
                                                        }}
                                                        disabled={toggleApprovalMutation.isPending}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${
                                                          employee.isApproved ? "bg-green-500" : "bg-gray-300"
                                                        } disabled:opacity-60`}
                                                      >
                                                        <span
                                                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                                            employee.isApproved ? "translate-x-6" : "translate-x-1"
                                                          }`}
                                                        />
                                                      </button>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(employee.updatedAt)}</td>
                                                  </tr>
                                                ))
                                              ) : (
                                                <tr>
                                                  <td colSpan={6} className="py-3 pl-28 pr-4 text-sm text-gray-500">
                                                    No employees assigned to this team lead.
                                                  </td>
                                                </tr>
                                              ))}
                                          </Fragment>
                                        );
                                      })
                                    ) : (
                                      <tr>
                                        <td colSpan={6} className="py-4 pl-20 pr-4 text-sm text-gray-500">
                                          No team leads assigned to this admin.
                                        </td>
                                      </tr>
                                    ))}
                                </Fragment>
                              );
                            })}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Name",
                      "Contact",
                      "Email",
                      "Status",
                      "Reporting Manager",
                      "Created On",
                      "Edited On",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-sm text-center text-gray-500">
                        {search ? "No team members match your search." : "No team members found."}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((member) => (
                      <tr key={member._id} className="transition-colors cursor-pointer hover:bg-gray-50" onDoubleClick={() => navigate(`/team/${member._id}`)}>
                        {/* Name */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full shrink-0">
                              <span className="text-xs font-semibold text-blue-600">
                                {member.name?.charAt(0).toUpperCase() ?? "?"}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{member.name}</p>
                              {member.employeeId && (
                                <p className="text-xs text-gray-400">{member.employeeId}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                          {member.phoneNumber ?? "—"}
                        </td>

                        {/* Email */}
                        <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                          {member.email ?? "—"}
                        </td>

                        {/* Status toggle */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              toggleApprovalMutation.mutate({
                                userId: member._id,
                                isApproved: !member.isApproved,
                              })
                            }
                            disabled={toggleApprovalMutation.isPending}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${
                              member.isApproved ? "bg-green-500" : "bg-gray-300"
                            } disabled:opacity-60`}
                            title={member.isApproved ? "Active — click to deactivate" : "Inactive — click to activate"}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                member.isApproved ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td>

                        {/* Reporting Manager */}
                        <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                          {member.teamleadName ?? "—"}
                        </td>

                        {/* Created On */}
                        <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(member.createdAt)}
                        </td>

                        {/* Edited On */}
                        <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(member.updatedAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onNext={(data) => {
          setStep1Data(data);
          setAddOpen(false);
          setAddDetailsOpen(true);
        }}
        userRole={currentUser.role}
        userDomain={currentUser.domain}
      />

      <MemberDetailsModal
        isOpen={addDetailsOpen}
        onClose={() => {
          setAddDetailsOpen(false);
          queryClient.invalidateQueries({ queryKey: ["users"] });
        }}
        onBack={() => {
          setAddDetailsOpen(false);
          setAddOpen(true);
        }}
        domain={step1Data.domain}
        designation={step1Data.designation}
      />
    </div>
  );
};

export default TeamPage;
