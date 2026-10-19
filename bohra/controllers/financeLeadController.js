const mongoose = require("mongoose");
const fs = require("fs");

const FinanceLead = require("../models/financeLead");
const FinanceLeadHistory = require("../models/financeLeadHistory");
const User = require("../models/user");
const {
  notifyUser,
  notifyLeadFollowup,
  notifyLeadStatusChange,
  notifyLeadTransfer,
} = require("../utils/socketService");

const XLSX = require("xlsx");
const csvtojson = require("csvtojson");

/* =====================================================
   SANITIZE HISTORY OUTPUT HELPERS
===================================================== */
function bufferObjectToHex(bufObj) {
  if (!bufObj) return null;
  if (Array.isArray(bufObj)) return Buffer.from(bufObj).toString("hex");
  if (bufObj && typeof bufObj === "object") {
    const keys = Object.keys(bufObj).sort((a, b) => Number(a) - Number(b));
    const arr = keys.map((k) => bufObj[k]);
    return Buffer.from(arr).toString("hex");
  }
  return null;
}

function normalizeIdValue(v) {
  if (!v) return v;
  if (typeof v === "string") return v;
  if (v && typeof v.toHexString === "function") {
    try {
      return v.toHexString();
    } catch (e) {}
  }
  if (v && v._bsontype === "ObjectID") {
    if (v.id && v.id.buffer) return bufferObjectToHex(v.id.buffer);
  }
  if (v && v.buffer) {
    return bufferObjectToHex(v.buffer);
  }
  if (v && v.id && v.id.buffer) {
    return bufferObjectToHex(v.id.buffer);
  }
  return v;
}

function sanitizeValue(value) {
  if (value == null) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sanitizeValue);

  const normalized = normalizeIdValue(value);
  if (typeof normalized === "string" && /^[0-9a-fA-F]{24}$/.test(normalized)) return normalized;

  const out = {};
  for (const k of Object.keys(value)) {
    out[k] = sanitizeValue(value[k]);
  }
  return out;
}

const LEAD_POPULATE = [
  { path: "createdBy", select: "name email phoneNumber role employeeId" },
  { path: "teamLead", select: "name email phoneNumber role employeeId" },
  { path: "relationshipManager", select: "name email phoneNumber role employeeId" },
];

// ✅ finance-specific keys
const LEAD_ALLOWED_FIELDS = [
  "clientName",
  "contactNumber",
  "email",
  "loanRequirement",
  "location",
  "Eligibility",
  "source",
  "followUpDate",
  "notes",
  "remarks",
  "relationshipManager",
  "teamLead",
];

// ✅ Status list (must match model enum — "login" is now a stage, not a status)
const FINANCE_ALLOWED_STATUSES = new Set([
  "Dead",
  "Follow up",
  "Interested",
  "Busy",
  "Closed",
]);

const FINANCE_ALLOWED_STAGES = new Set(["Lead", "Login"]);

// -----------------------
// Helpers
// -----------------------
const pick = (obj, keys) => {
  const out = {};
  keys.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  });
  return out;
};

/* =====================================================
   BULK UPLOAD FINANCE LEADS (CSV / XLS / XLSX)
   See implementation below (line ~1302)
===================================================== */

function normalizePhone(phone) {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "");
}

/* =====================================================
   EXTRACT FIELD-LEVEL CHANGES (previous vs current)
===================================================== */
function extractChanges(previous, current) {
  const changes = [];
  const allKeys = new Set([
    ...Object.keys(previous || {}),
    ...Object.keys(current || {}),
  ]);

  for (const key of allKeys) {
    const prevVal = previous?.[key];
    const currVal = current?.[key];

    if (JSON.stringify(prevVal) === JSON.stringify(currVal)) continue;
    if (["_id", "__v", "createdAt", "updatedAt"].includes(key)) continue;
    if (
      typeof prevVal === "object" &&
      prevVal !== null &&
      typeof currVal === "object" &&
      currVal !== null
    ) {
      continue;
    }

    changes.push({
      field: key,
      previous: prevVal === undefined ? null : prevVal,
      current: currVal === undefined ? null : currVal,
    });
  }

  return changes;
}

/* =====================================================
   FORMAT HISTORY AS GROUPED TIMELINE
===================================================== */
function groupHistoryByUser(historyRecords) {
  const groupsMap = new Map(); // userId => { user, activities }

  const actionTypeMap = {
    CREATED: { type: "Created", icon: "circle", color: "green" },
    UPDATED: { type: "Updated", icon: "circle", color: "blue" },
    DELETED: { type: "Deleted", icon: "circle", color: "red" },
    STATUS_CHANGED: { type: "Status", icon: "circle", color: "green" },
    STAGE_CHANGED: { type: "Stage", icon: "circle", color: "blue" },
    FOLLOWUP_CHANGED: { type: "Follow Up", icon: "circle", color: "orange" },
    TRANSFERRED: { type: "Transfer", icon: "circle", color: "purple" },
    BULK_UPLOADED: { type: "Bulk Upload", icon: "circle", color: "blue" },
    BULK_TRANSFERRED: { type: "Bulk Transfer", icon: "circle", color: "purple" },
  };

  for (const record of historyRecords) {
    const userId = record.performedBy?._id || record.performedBy;
    const userKey = String(userId);

    if (!groupsMap.has(userKey)) {
      groupsMap.set(userKey, {
        user: record.performedBy || { _id: userId, name: "Unknown", email: "" },
        activities: [],
      });
    }

    const group = groupsMap.get(userKey);

    let timestamp = "";
    if (record.createdAt) {
      const date = new Date(record.createdAt);
      const monthStr = date.toLocaleString("en-US", { month: "short" });
      const dayStr = String(date.getDate()).padStart(2, "0");
      const yearStr = date.getFullYear();
      const timeStr = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      timestamp = `${monthStr} ${dayStr}, ${yearStr} | ${timeStr}`;
    }

    const actionInfo = actionTypeMap[record.action] || {
      type: record.action,
      icon: "circle",
      color: "gray",
    };

    const changes = extractChanges(record.previous, record.current);

    const activity = {
      _id: record._id,
      action: record.action,
      type: actionInfo.type,
      icon: actionInfo.icon,
      color: actionInfo.color,
      description: record.message || actionInfo.type,
      timestamp,
      createdAt: record.createdAt,
      changes,
      ip: record.ip,
      userAgent: record.userAgent,
    };

    group.activities.push(activity);
  }

  return Array.from(groupsMap.values()).map((group) => ({
    ...group,
    activities: group.activities.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    ),
  }));
}

/**
 * ✅ Parse followUpDate in IST format properly.
 * Supports:
 * 1) "2026-01-25"                 -> IST 00:00
 * 2) "2026-01-25 18:30"           -> IST 18:30
 * 3) "2026-01-25T18:30:00+05:30"  -> as it is
 */
function parseISTDateTime(input) {
  if (!input) return null;

  if (input instanceof Date) return input;

  if (
    typeof input === "string" &&
    input.includes("T") &&
    (input.includes("+") || input.includes("Z"))
  ) {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    const d = new Date(`${input.trim()}T00:00:00+05:30`);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(input.trim())) {
    const d = new Date(input.trim().replace(" ", "T") + ":00+05:30");
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

// ✅ Stage flow rule: Lead → Login only (one-way)
function canChangeStage(currentStage, nextStage) {
  if (currentStage === nextStage) return true;
  if (currentStage === "Lead" && nextStage === "Login") return true;
  return false;
}

// ✅ Status flow rule (login removed — it is now a stage)
function canChangeStatus(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) return true;

  const FLOW = {
    "Follow up": ["Interested", "Busy", "Dead", "Closed"],
    Interested: ["Follow up", "Busy", "Dead", "Closed"],
    Busy: ["Follow up", "Interested", "Dead", "Closed"],
    Dead: [],
    Closed: [],
    null: ["Follow up", "Interested", "Busy", "Dead", "Closed"],
  };

  return FLOW[currentStatus]?.includes(nextStatus) ?? true;
}

async function recordHistory(req, { leadId, action, previous = {}, current = {}, message = "" }) {
  const ip = req.headers["x-forwarded-for"]?.toString()?.split(",")[0]?.trim() || req.ip;
  const userAgent = req.headers["user-agent"] || "";

  await FinanceLeadHistory.create({
    leadId,
    action,
    performedBy: req.user.userId,
    previous,
    current,
    message,
    ip,
    userAgent,
  });
}

// ✅ Resolve user by Name (so you can send name instead of objectId)
async function resolveUserIdByName(name, extraFilter = {}) {
  if (!name || typeof name !== "string") return null;
  const user = await User.findOne({ name: name.trim(), ...extraFilter }).select("_id");
  return user?._id || null;
}

// ✅ RBAC filter builder
async function buildLeadAccessFilter(req) {
  const { userId, role } = req.user;
  const normalizedRole = String(role || "").toLowerCase();
  const currentUserId = new mongoose.Types.ObjectId(userId);

  if (normalizedRole === "superadmin" || normalizedRole === "admin") return {};

  // Employees should only see leads explicitly assigned to them as Relationship Manager.
  if (normalizedRole === "employee") return { relationshipManager: currentUserId };

  if (normalizedRole === "teamlead") {
    const employees = await User.find({
      role: "employee",
      createdBy: currentUserId,
    }).select("_id");

    const employeeIds = employees.map((e) => e._id);

    return {
      $or: [
        { createdBy: currentUserId },
        { createdBy: { $in: employeeIds } },
        { teamLead: currentUserId },
      ],
    };
  }

  return { createdBy: currentUserId };
}

// ✅ Determine teamLeadId automatically
async function resolveTeamLeadId(req) {
  const { userId, role } = req.user;

  if (role === "teamlead") return userId;

  if (role === "employee") {
    const emp = await User.findById(userId).select("createdBy");
    return emp?.createdBy || null;
  }

  return null;
}

// =====================================================
// ✅ CREATE FINANCE LEAD (TRANSFER SUPPORTED)
// POST /api/finance-leads
// =====================================================
exports.createLead = async (req, res) => {
  try {
    const { userId } = req.user;

    // ✅ relationshipManagerName => relationshipManager
    if (req.body.relationshipManagerName) {
      const rmId = await resolveUserIdByName(req.body.relationshipManagerName);
      if (!rmId) {
        return res.status(400).json({
          success: false,
          message: `relationshipManagerName not found: ${req.body.relationshipManagerName}`,
        });
      }
      req.body.relationshipManager = rmId;
    }

    // ✅ teamLeadName => teamLead
    if (req.body.teamLeadName) {
      const tlId = await resolveUserIdByName(req.body.teamLeadName, { role: "teamlead" });
      if (!tlId) {
        return res.status(400).json({
          success: false,
          message: `teamLeadName not found: ${req.body.teamLeadName}`,
        });
      }
      req.body.teamLead = tlId;
    }

    // Backward compatibility: treat transferToName as relationshipManagerName.
    if (req.body.transferToName && !req.body.relationshipManagerName && !req.body.relationshipManager) {
      const toId = await resolveUserIdByName(req.body.transferToName);
      if (!toId) {
        return res.status(400).json({
          success: false,
          message: `transferToName not found: ${req.body.transferToName}`,
        });
      }
      req.body.relationshipManager = toId;
    }

    const autoTeamLead = await resolveTeamLeadId(req);

    // ✅ Validate status if provided
    if (req.body.status && !FINANCE_ALLOWED_STATUSES.has(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status: ${req.body.status}`,
      });
    }

    const payload = pick(req.body, LEAD_ALLOWED_FIELDS);

    if (payload.contactNumber) payload.contactNumber = normalizePhone(payload.contactNumber);

    // ✅ parse followUpDate IST
    if (payload.followUpDate) {
      payload.followUpDate = parseISTDateTime(payload.followUpDate);
      if (!payload.followUpDate) {
        return res.status(400).json({ success: false, message: "Invalid followUpDate format" });
      }
    }

    const now = new Date();
    const isTransferredOnCreate = !!payload.relationshipManager;

    const lead = await FinanceLead.create({
      ...payload,
      createdBy: userId,
      teamLead: payload.teamLead || autoTeamLead,
      transferDate: isTransferredOnCreate ? now : null,
    });

    await recordHistory(req, {
      leadId: lead._id,
      action: isTransferredOnCreate ? "TRANSFERRED" : "CREATED",
      previous: {},
      current: lead.toObject(),
      message: isTransferredOnCreate ? "Finance lead created and transferred" : "Finance lead created",
    });

    const populated = await FinanceLead.findById(lead._id).populate(LEAD_POPULATE);

    // Emit real-time notifications
    try {
      if (isTransferredOnCreate && payload.relationshipManager) {
        await notifyLeadTransfer(populated, null, payload.relationshipManager, {
          transferredBy: userId,
          teamLead: payload.teamLead || autoTeamLead,
        });
      }
    } catch (notifErr) {
      console.error("Notification error (non-blocking):", notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: isTransferredOnCreate
        ? "Lead created and transferred successfully"
        : "Finance lead created successfully",
      data: populated,
    });
  } catch (err) {
    console.error("createLead error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================================================
// ✅ GET FINANCE LEADS
// =====================================================


/* =====================================================
   Escape Regex
===================================================== */
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


/* =====================================================
   Resolve User IDs By Name
===================================================== */
async function resolveUserIdsByName(name, extraFilter = {}) {
  if (!name || typeof name !== "string") return [];

  if (["null", "undefined"].includes(name.toLowerCase())) return [];

  if (mongoose.Types.ObjectId.isValid(name.trim())) {
    return [new mongoose.Types.ObjectId(name.trim())];
  }

  const safe = escapeRegex(name.trim());

  const users = await User.find({
    name: { $regex: safe, $options: "i" },
    ...extraFilter,
  }).select("_id");

  return users.map((u) => u._id);
}


/* =====================================================
   Empty Response
===================================================== */
function empty(res, page, limit) {
  return res.status(200).json({
    success: true,
    message: "No finance leads found",

    meta: {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },

    data: [],
  });
}


exports.getLeads = async (req, res) => {
  try {
    /* ================= CLEAN QUERY ================= */

    Object.keys(req.query).forEach((k) => {
      if (typeof req.query[k] === "string") {
        req.query[k] = req.query[k].trim();
      }
    });

    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = "createdAt",
      order = "desc",
      teamLead,
      rm,
      employee,
      transferTo,
      unassigned,
      from,
      to,
      followFrom,
      followTo,
      activityStatus,
    } = req.query;

    /* ================= PAGINATION ================= */

    const pageNum = Math.max(Number(page), 1);
    const limitNum = Math.max(Number(limit), 1);
    const skip = (pageNum - 1) * limitNum;

    /* ================= BASE FILTER ================= */

    const accessFilter = await buildLeadAccessFilter(req);
    const filter = { ...accessFilter };

    /* ================= STAGE / STATUS (tab) ================= */

    /**
     * `status` = active tab value:
     *   "Leads"   → stage = "Lead"
     *   "login"   → stage = "Login"
     *   "Dead"    → status = "Dead" (across any stage)
     *   undefined → no stage filter
     */
    if (!status || status === "All") {
      // no stage filter
    } else if (status === "Leads") {
      filter.stage = "Lead";
      filter.status = { $ne: "Dead" };
    } else if (status === "login" || status === "Login") {
      filter.stage = "Login";
      filter.status = { $ne: "Dead" };
    } else if (status === "Dead") {
      filter.status = "Dead";
    } else {
      // Comma-separated fallback
      const statuses = status.split(",").map((s) => s.trim()).filter(Boolean);
      filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }

    /* ================= ACTIVITY STATUS FILTER ================= */
    if (activityStatus) {
      const statuses = activityStatus.split(",").map((s) => s.trim()).filter(Boolean);
      filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }

    /* ================= SEARCH ================= */

    if (search && search.length >= 2) {
      // Wrap in double quotes for exact phrase matching (MongoDB $text)
      const safeSearch = search.trim().replace(/"/g, '');
      filter.$text = { $search: `"${safeSearch}"` };
    }

    /* ================= NORMALIZE ================= */

    const normalize = (v) =>
      !v ? [] : v.split(",").map((x) => x.trim()).filter(Boolean);

    const teamLeadNames = normalize(teamLead);
    const rmNames = normalize(rm);
    const employeeNames = normalize(employee);
    const transferNames = normalize(transferTo);
    const mergedRmNames = [...rmNames, ...transferNames];

    /* ================= RESOLVE IDS ================= */

    const [teamLeadIds, rmIds, employeeIds] = await Promise.all([
      resolveUserIdsByName(teamLeadNames, {
        $or: [{ role: "teamlead" }, { designation: "teamlead" }],
      }),
      resolveUserIdsByName(mergedRmNames),
      resolveUserIdsByName(employeeNames),
    ]);

    /* ================= STRICT VALIDATION ================= */

    if (teamLeadNames.length && !teamLeadIds.length) {
      return empty(res, pageNum, limitNum);
    }

    if (rmNames.length && !rmIds.length && unassigned !== "true") {
      return empty(res, pageNum, limitNum);
    }

    /* ================= CORE FILTER LOGIC (AND) ================= */

    // ✅ ONE teamLead → MANY leads
    if (teamLeadIds.length) {
      filter.teamLead = teamLeadIds[0];
    }

    // ✅ MANY relationship managers
    if (unassigned === "true") {
      filter.relationshipManager = null;
    } else if (rmIds.length) {
      filter.relationshipManager = { $in: rmIds };
    }

    // optional AND filters
    if (employeeIds.length) {
      filter.createdBy = { $in: employeeIds };
    }

    // Legacy compatibility: transferTo query is mapped to relationship manager filtering.

    /* ================= DATE FILTERS ================= */

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    if (followFrom || followTo) {
      filter.followUpDate = {};
      if (followFrom) filter.followUpDate.$gte = new Date(followFrom);
      if (followTo) filter.followUpDate.$lte = new Date(followTo);
    }

    /* ================= SORT ================= */

    const sort = { [sortBy]: order === "asc" ? 1 : -1, _id: -1 };

    /* ================= QUERY ================= */

    const [total, leads] = await Promise.all([
      FinanceLead.countDocuments(filter),
      FinanceLead.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate([
          { path: "createdBy", select: "name email phoneNumber role employeeId" },
          { path: "teamLead", select: "name email phoneNumber role employeeId" },
          { path: "relationshipManager", select: "name email phoneNumber role employeeId" },
        ]),
    ]);

    return res.status(200).json({
      success: true,
      message: "Finance leads fetched",
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      data: leads,
    });

  } catch (err) {
    console.error("Finance getLeads error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};








exports.getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const accessFilter = await buildLeadAccessFilter(req);

    const lead = await FinanceLead.findOne({ _id: id, ...accessFilter }).populate(LEAD_POPULATE);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Finance lead not found / unauthorized",
      });
    }

    return res.status(200).json({ success: true, data: lead });
  } catch (err) {
    console.error("getLeadById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================================================
// ✅ UPDATE FINANCE LEAD (TRANSFER SUPPORTED)
// =====================================================
// exports.updateLead = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const accessFilter = await buildLeadAccessFilter(req);

//     const oldLead = await FinanceLead.findOne({ _id: id, ...accessFilter }).populate(LEAD_POPULATE);
//     if (!oldLead) {
//       return res.status(404).json({
//         success: false,
//         message: "Finance lead not found / unauthorized",
//       });
//     }

//     // ✅ Status update should still go via /status
//     if (req.body.status) {
//       return res.status(400).json({
//         success: false,
//         message: "Use /status API for status update",
//       });
//     }

//     // ✅ Do NOT allow frontend to set transferDate manually
//     if (req.body.transferDate) delete req.body.transferDate;

//     // ✅ prevent clearing transferTo using empty value
//     if (req.body.transferTo === "" || req.body.transferTo === null) {
//       delete req.body.transferTo;
//     }

//     // ✅ teamLeadName => teamLead
//     if (req.body.teamLeadName) {
//       const tlId = await resolveUserIdByName(req.body.teamLeadName, { role: "teamlead" });
//       if (!tlId) {
//         return res.status(400).json({
//           success: false,
//           message: `teamLeadName not found: ${req.body.teamLeadName}`,
//         });
//       }
//       req.body.teamLead = tlId;
//     }

//     // ✅ relationshipManagerName => relationshipManager
//     if (req.body.relationshipManagerName) {
//       const rmId = await resolveUserIdByName(req.body.relationshipManagerName);
//       if (!rmId) {
//         return res.status(400).json({
//           success: false,
//           message: `relationshipManagerName not found: ${req.body.relationshipManagerName}`,
//         });
//       }
//       req.body.relationshipManager = rmId;
//     }

//     // ✅ transferToName => transferTo
//     if (req.body.transferToName && !req.body.transferTo) {
//       const toId = await resolveUserIdByName(req.body.transferToName);
//       if (!toId) {
//         return res.status(400).json({
//           success: false,
//           message: `transferToName not found: ${req.body.transferToName}`,
//         });
//       }
//       req.body.transferTo = toId;
//     }

//     const updates = pick(req.body, LEAD_ALLOWED_FIELDS);

//     if (updates.contactNumber) updates.contactNumber = normalizePhone(updates.contactNumber);

//     // ✅ FIX: parse followUpDate IST
//    // ✅ FIX: parse followUpDate IST
// if (updates.followUpDate) {
//   updates.followUpDate = parseISTDateTime(updates.followUpDate);

//   if (!updates.followUpDate) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid followUpDate format in finance lead"
//     });
//   }

//   // ✅ Reset reminder when follow-up date changes
//   updates.reminderSent = false;
// }


//     // ✅ Allow transfer in update + auto set transferDate
//     const isTransfer = !!req.body.transferTo;
//     if (isTransfer) {
//       updates.transferTo = req.body.transferTo;
//       updates.transferDate = new Date();
//     }

//     const updated = await FinanceLead.findOneAndUpdate(
//       { _id: id, ...accessFilter },
//       { $set: updates },
//       { new: true }
//     ).populate(LEAD_POPULATE);

//     await recordHistory(req, {
//       leadId: id,
//       action: isTransfer ? "TRANSFERRED" : "UPDATED",
//       previous: isTransfer
//         ? {
//             transferTo: oldLead.transferTo?._id || null,
//             transferToName: oldLead.transferTo?.name || null,
//             transferDate: oldLead.transferDate || null,
//           }
//         : oldLead.toObject(),
//       current: isTransfer
//         ? {
//             transferTo: updated.transferTo?._id || null,
//             transferToName: updated.transferTo?.name || null,
//             transferDate: updated.transferDate || null,
//           }
//         : updates,
//       message: isTransfer ? "Finance lead transferred via updateLead" : "Finance lead updated",
//     });

//     return res.status(200).json({
//       success: true,
//       message: isTransfer ? "Lead transferred successfully" : "Finance lead updated",
//       data: updated,
//     });
//   } catch (err) {
//     console.error("updateLead error:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };

exports.updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const accessFilter = await buildLeadAccessFilter(req);

    const oldLead = await FinanceLead
      .findOne({ _id: id, ...accessFilter })
      .populate(LEAD_POPULATE);

    if (!oldLead) {
      return res.status(404).json({
        success: false,
        message: "Finance lead not found / unauthorized",
      });
    }

    /* ---------------- NAME → ID RESOLUTION ---------------- */

    if (req.body.teamLeadName) {
      const tlId = await resolveUserIdByName(req.body.teamLeadName, { role: "teamlead" });
      if (!tlId) {
        return res.status(400).json({
          success: false,
          message: `teamLeadName not found: ${req.body.teamLeadName}`,
        });
      }
      req.body.teamLead = tlId;
    }

    if (req.body.relationshipManagerName) {
      const rmId = await resolveUserIdByName(req.body.relationshipManagerName);
      if (!rmId) {
        return res.status(400).json({
          success: false,
          message: `relationshipManagerName not found: ${req.body.relationshipManagerName}`,
        });
      }
      req.body.relationshipManager = rmId;
    }

    if (req.body.transferToName && !req.body.relationshipManager && !req.body.relationshipManagerName) {
      const toId = await resolveUserIdByName(req.body.transferToName);
      if (!toId) {
        return res.status(400).json({
          success: false,
          message: `transferToName not found: ${req.body.transferToName}`,
        });
      }
      req.body.relationshipManager = toId;
    }

    if (req.body.transferTo && !req.body.relationshipManager) {
      req.body.relationshipManager = req.body.transferTo;
    }

    /* ---------------- ALLOWED UPDATES ---------------- */

    const updates = pick(req.body, LEAD_ALLOWED_FIELDS);

    if (updates.contactNumber) {
      updates.contactNumber = normalizePhone(updates.contactNumber);
    }

    /* ---------------- FOLLOW-UP DATE ---------------- */

    if (updates.followUpDate) {
      const parsed = parseISTDateTime(updates.followUpDate);

      if (!parsed) {
        return res.status(400).json({
          success: false,
          message: "Invalid followUpDate format in finance lead",
        });
      }

      updates.followUpDate = parsed;
      updates.reminderSent = false;
    }

    /* ---------------- TRANSFER HANDLING ---------------- */

    const oldTransferTo = oldLead.relationshipManager?._id
      ? String(oldLead.relationshipManager._id)
      : null;

    const newTransferTo = updates.relationshipManager
      ? String(updates.relationshipManager)
      : null;

    const isTransferChanged = newTransferTo && newTransferTo !== oldTransferTo;

    if (isTransferChanged) {
      updates.transferDate = new Date();
    }

    /* ---------------- UPDATE ---------------- */

    const updated = await FinanceLead.findOneAndUpdate(
      { _id: id, ...accessFilter },
      { $set: updates },
      { new: true }
    ).populate(LEAD_POPULATE);

    /* ---------------- HISTORY ---------------- */

    await recordHistory(req, {
      leadId: id,
      action: isTransferChanged ? "TRANSFERRED" : "UPDATED",
      previous: oldLead.toObject(),
      current: updates,
      message: isTransferChanged
        ? "Finance lead transferred via updateLead"
        : "Finance lead updated",
    });

    // Emit real-time notifications
    try {
      if (isTransferChanged) {
        await notifyLeadTransfer(updated, oldTransferTo, newTransferTo, {
          transferredBy: req.user.userId,
          teamLead: updated.teamLead?._id || null,
        });
      }
      // Follow-up reminders are handled by cron at the scheduled time — no immediate notification
    } catch (notifErr) {
      console.error("Notification error (non-blocking):", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: isTransferChanged
        ? "Lead transferred successfully"
        : "Finance lead updated",
      data: updated,
    });
  } catch (err) {
    console.error("updateLead error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// ✅ UPDATE STATUS
// =====================================================
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ success: false, message: "status is required" });

    if (!FINANCE_ALLOWED_STATUSES.has(status)) {
      return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    }

    const accessFilter = await buildLeadAccessFilter(req);

    const lead = await FinanceLead.findOne({ _id: id, ...accessFilter });
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Finance lead not found / unauthorized",
      });
    }

    const prevStatus = lead.status;

    if (!canChangeStatus(prevStatus, status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status flow: ${prevStatus} -> ${status}`,
      });
    }

    lead.status = status;
    await lead.save();

    await recordHistory(req, {
      leadId: id,
      action: "STATUS_CHANGED",
      previous: { status: prevStatus },
      current: { status },
      message: `Status changed ${prevStatus} -> ${status}`,
    });

    const populated = await FinanceLead.findById(id).populate(LEAD_POPULATE);

    // Emit real-time notification for status change
    try {
      await notifyLeadStatusChange(populated, prevStatus, status, {
        createdBy: populated.createdBy?._id || req.user.userId,
        teamLead: populated.teamLead?._id || null,
      });
    } catch (notifErr) {
      console.error("Notification error (non-blocking):", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Status updated",
      data: populated,
    });
  } catch (err) {
    console.error("updateStatus error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================================================
// ✅ UPDATE STAGE (Lead → Login only, irreversible)
// PATCH /api/fleads/:id/stage
// =====================================================
exports.updateStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    if (!stage) return res.status(400).json({ success: false, message: "stage is required" });

    if (!FINANCE_ALLOWED_STAGES.has(stage)) {
      return res.status(400).json({ success: false, message: `Invalid stage: ${stage}` });
    }

    const accessFilter = await buildLeadAccessFilter(req);
    const lead = await FinanceLead.findOne({ _id: id, ...accessFilter });
    if (!lead) {
      return res.status(404).json({ success: false, message: "Finance lead not found / unauthorized" });
    }

    const prevStage = lead.stage;

    if (!canChangeStage(prevStage, stage)) {
      return res.status(400).json({
        success: false,
        message: `Invalid stage progression: ${prevStage} → ${stage}. Stages can only move forward.`,
      });
    }

    lead.stage = stage;
    await lead.save();

    await recordHistory(req, {
      leadId: id,
      action: "STAGE_CHANGED",
      previous: { stage: prevStage },
      current: { stage },
      message: `Stage advanced ${prevStage} → ${stage}`,
    });

    const populated = await FinanceLead.findById(id).populate(LEAD_POPULATE);

    return res.status(200).json({
      success: true,
      message: `Stage advanced to ${stage}`,
      data: populated,
    });
  } catch (err) {
    console.error("updateStage error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================================================
// ✅ TRANSFER LEAD
// =====================================================
exports.transferLead = async (req, res) => {
  try {
    const { id } = req.params;
    let { relationshipManager, relationshipManagerName, transferTo, transferToName } = req.body;

    if (!relationshipManager && transferTo) relationshipManager = transferTo;
    if (!relationshipManagerName && transferToName) relationshipManagerName = transferToName;

    if (!relationshipManager && relationshipManagerName) {
      const toId = await resolveUserIdByName(relationshipManagerName);
      if (!toId) {
        return res.status(400).json({
          success: false,
          message: `relationshipManagerName not found: ${relationshipManagerName}`,
        });
      }
      relationshipManager = toId;
    }

    if (!relationshipManager) {
      return res.status(400).json({
        success: false,
        message: "relationshipManager OR relationshipManagerName is required",
      });
    }

    const accessFilter = await buildLeadAccessFilter(req);

    const oldLead = await FinanceLead.findOne({ _id: id, ...accessFilter }).populate(LEAD_POPULATE);
    if (!oldLead) {
      return res.status(404).json({
        success: false,
        message: "Finance lead not found / unauthorized",
      });
    }

    const now = new Date();

    const updated = await FinanceLead.findOneAndUpdate(
      { _id: id, ...accessFilter },
      { $set: { relationshipManager, transferDate: now } },
      { new: true }
    ).populate(LEAD_POPULATE);

    await recordHistory(req, {
      leadId: id,
      action: "TRANSFERRED",
      previous: {
        relationshipManager: oldLead.relationshipManager?._id || null,
        relationshipManagerName: oldLead.relationshipManager?.name || null,
        transferDate: oldLead.transferDate || null,
      },
      current: {
        relationshipManager: updated.relationshipManager?._id || null,
        relationshipManagerName: updated.relationshipManager?.name || null,
        transferDate: now,
      },
      message: `Finance lead reassigned to ${updated.relationshipManager?.name || "N/A"}`,
    });

    // Emit real-time transfer notification
    try {
      await notifyLeadTransfer(updated, oldLead.relationshipManager?._id || null, relationshipManager, {
        transferredBy: req.user.userId,
        teamLead: updated.teamLead?._id || null,
      });
    } catch (notifErr) {
      console.error("Notification error (non-blocking):", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Lead transferred",
      data: updated,
    });
  } catch (err) {
    console.error("transferLead error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================================================
// ✅ BULK TRANSFER LEADS
// =====================================================
exports.bulkTransferLeads = async (req, res) => {
  try {
    let { leadIds, relationshipManager, relationshipManagerName, transferTo, transferToName } = req.body;

    if (!relationshipManager && transferTo) relationshipManager = transferTo;
    if (!relationshipManagerName && transferToName) relationshipManagerName = transferToName;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "leadIds array is required",
      });
    }

    if (!relationshipManager && relationshipManagerName) {
      const toId = await resolveUserIdByName(relationshipManagerName);
      if (!toId) {
        return res.status(400).json({
          success: false,
          message: `relationshipManagerName not found: ${relationshipManagerName}`,
        });
      }
      relationshipManager = toId;
    }

    if (!relationshipManager) {
      return res.status(400).json({
        success: false,
        message: "relationshipManager OR relationshipManagerName is required",
      });
    }

    const toUser = await User.findById(relationshipManager).select("name");
    const resolvedName = toUser?.name || relationshipManagerName || null;

    const accessFilter = await buildLeadAccessFilter(req);

    const leads = await FinanceLead.find({
      _id: { $in: leadIds.map((x) => new mongoose.Types.ObjectId(x)) },
      ...accessFilter,
    }).populate(LEAD_POPULATE);

    if (!leads.length) {
      return res.status(404).json({
        success: false,
        message: "No leads found / unauthorized",
      });
    }

    const now = new Date();

    const updateRes = await FinanceLead.updateMany(
      { _id: { $in: leads.map((l) => l._id) } },
      { $set: { relationshipManager, transferDate: now } }
    );

    await Promise.all(
      leads.map((lead) =>
        recordHistory(req, {
          leadId: lead._id,
          action: "BULK_TRANSFERRED",
          previous: {
            relationshipManager: lead.relationshipManager?._id || null,
            relationshipManagerName: lead.relationshipManager?.name || null,
            transferDate: lead.transferDate || null,
          },
          current: {
            relationshipManager,
            relationshipManagerName: resolvedName,
            transferDate: now,
          },
          message: `Bulk reassigned to ${resolvedName || relationshipManager}`,
        })
      )
    );

    return res.status(200).json({
      success: true,
      message: "Bulk transfer completed",
      summary: {
        requested: leadIds.length,
        allowedFound: leads.length,
        modified: updateRes.modifiedCount ?? updateRes.nModified ?? 0,
      },
    });
  } catch (err) {
    console.error("bulkTransferLeads error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================================================
// ✅ FOLLOWUP (FIXED IST STORAGE)
// =====================================================
exports.updateFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { followUpDate } = req.body;

    const accessFilter = await buildLeadAccessFilter(req);

    const oldLead = await FinanceLead.findOne({ _id: id, ...accessFilter });
    if (!oldLead) {
      return res.status(404).json({
        success: false,
        message: "Finance lead not found / unauthorized",
      });
    }

    const parsedFollowUp = followUpDate ? parseISTDateTime(followUpDate) : null;
    if (followUpDate && !parsedFollowUp) {
      return res.status(400).json({ success: false, message: "Invalid followUpDate format" });
    }

    const setFields = { followUpDate: parsedFollowUp };
    if (parsedFollowUp) setFields.reminderSent = false;

    const updated = await FinanceLead.findOneAndUpdate(
      { _id: id, ...accessFilter },
      { $set: setFields },
      { new: true }
    ).populate(LEAD_POPULATE);

    await recordHistory(req, {
      leadId: id,
      action: "FOLLOWUP_CHANGED",
      previous: { followUpDate: oldLead.followUpDate || null },
      current: { followUpDate: parsedFollowUp },
      message: "Follow-up date updated",
    });

    // Follow-up reminders are handled by cron job at the scheduled time
    // No immediate notification needed here

    return res.status(200).json({
      success: true,
      message: "Follow-up updated",
      data: updated,
    });
  } catch (err) {
    console.error("updateFollowUp error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================================================
// ✅ HISTORY
// =====================================================
exports.getLeadHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 30 } = req.query;

    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.max(parseInt(limit), 1);
    const skip = (pageNum - 1) * limitNum;

    const accessFilter = await buildLeadAccessFilter(req);

    const lead = await FinanceLead.findOne({ _id: id, ...accessFilter }).select("_id");
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Finance lead not found / unauthorized",
      });
    }

    const [total, history] = await Promise.all([
      FinanceLeadHistory.countDocuments({ leadId: id }),
      FinanceLeadHistory.find({ leadId: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: "performedBy",
          select: "name email role employeeId",
        }),
    ]);

    // Sanitize history entries: convert ObjectId/buffer objects to hex strings and format dates
    const sanitizedHistory = history.map((h) => {
      const obj = typeof h.toObject === "function" ? h.toObject() : h;
      return sanitizeValue(obj);
    });

    // Group history by user for timeline view with field-level changes
    const groupedHistory = groupHistoryByUser(sanitizedHistory);

    return res.status(200).json({
      success: true,
      message: "History fetched",
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      data: groupedHistory,
    });
  } catch (err) {
    console.error("getLeadHistory error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================================================
// ✅ DELETE
// =====================================================
exports.deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const accessFilter = await buildLeadAccessFilter(req);

    const lead = await FinanceLead.findOneAndDelete({ _id: id, ...accessFilter });
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Finance lead not found / unauthorized",
      });
    }

    await recordHistory(req, {
      leadId: id,
      action: "DELETED",
      previous: lead.toObject(),
      current: {},
      message: "Finance lead deleted",
    });

    return res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (err) {
    console.error("deleteLead error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================================================
// ✅ BULK DELETE
// =====================================================
exports.bulkDeleteLeads = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "ids array is required" });
    }

    const result = await FinanceLead.deleteMany({ _id: { $in: ids } });
    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} lead(s) deleted`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("bulkDeleteLeads error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================================================
// ✅ BULK UPLOAD (CSV/XLSX) (FIXED STATUS + IST FOLLOWUP)
// =====================================================
exports.bulkUploadLeads = async (req, res) => {
  let filePath = null;

  try {
    if (!req.file?.path) {
      return res.status(400).json({ success: false, message: "File is required" });
    }

    filePath = req.file.path;

    const { userId } = req.user;
    const teamLead = await resolveTeamLeadId(req);

    const ext = req.file.originalname.split(".").pop().toLowerCase();
    let rows = [];

    if (ext === "csv") {
      rows = await csvtojson().fromFile(filePath);
    } else if (ext === "xlsx" || ext === "xls") {
      const wb = XLSX.readFile(filePath);
      const sheet = wb.SheetNames[0];
      rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: "" });
    } else {
      return res.status(400).json({ success: false, message: "Only CSV/XLSX/XLS supported" });
    }

    if (!rows.length) {
      return res.status(400).json({ success: false, message: "No rows found in file" });
    }

    const mapRow = (row) => ({
      clientName: String(
        row.clientName ||
          row.ClientName ||
          row["Client Name"] ||
          row.name ||
          row.Name ||
          ""
      ).trim(),

      contactNumber: normalizePhone(
        row.contactNumber ||
          row.ContactNumber ||
          row["Contact Number"] ||
          row.phone ||
          row.Phone ||
          row.mobile ||
          ""
      ),

      email: (row.email || row.Email || "").toString().trim(),
      loanRequirement: (row.loanRequirement || row["Loan Requirement"] || row.LoanRequirement || "")
        .toString()
        .trim(),
      location: (row.location || row.Location || "").toString().trim(),
      Eligibility: (row.Eligibility || row.eligibility || row.Project || row.project || "").toString().trim(),
      source: (row.source || row.Source || "").toString().trim(),
      followUpDate: row.followUpDate || row["Follow Up Date"] || null,

      status: (row.status || row.Status || "Follow up").toString().trim(),

      notes: (row.notes || row.Notes || "").toString().trim(),
      remarks: (row.remarks || row.Remarks || "").toString().trim(),
    });

    const errors = [];
    const docs = [];
    const seenPhone = new Set();

    for (let i = 0; i < rows.length; i++) {
      const rowNo = i + 2;
      const d = mapRow(rows[i]);

      if (!d.clientName) {
        errors.push({ row: rowNo, error: "clientName missing" });
        continue;
      }

      if (!d.contactNumber || d.contactNumber.length !== 10) {
        errors.push({ row: rowNo, error: "contactNumber must be 10 digits" });
        continue;
      }

      // ✅ status enum validation (FIXED)
      if (d.status && !FINANCE_ALLOWED_STATUSES.has(d.status)) {
        errors.push({ row: rowNo, error: `Invalid status: ${d.status}` });
        continue;
      }

      if (seenPhone.has(d.contactNumber)) {
        errors.push({ row: rowNo, error: "Duplicate phone in file" });
        continue;
      }

      seenPhone.add(d.contactNumber);

      // ✅ parse followUpDate in IST
      const parsedFU = d.followUpDate ? parseISTDateTime(d.followUpDate) : null;
      if (d.followUpDate && !parsedFU) {
        errors.push({ row: rowNo, error: "Invalid followUpDate format" });
        continue;
      }

      docs.push({
        ...d,
        followUpDate: parsedFU,
        createdBy: userId,
        teamLead,
        transferDate: null,
      });
    }

    const phones = docs.map((x) => x.contactNumber);
    const existing = await FinanceLead.find({ contactNumber: { $in: phones } }).select("contactNumber");
    const existingSet = new Set(existing.map((e) => e.contactNumber));

    const finalDocs = [];
    for (const doc of docs) {
      if (existingSet.has(doc.contactNumber)) {
        errors.push({ row: null, error: `Duplicate in DB: ${doc.contactNumber}` });
      } else {
        finalDocs.push(doc);
      }
    }

    const inserted = await FinanceLead.insertMany(finalDocs, { ordered: false });

    await Promise.all(
      inserted.map((lead) =>
        recordHistory(req, {
          leadId: lead._id,
          action: "BULK_UPLOADED",
          previous: {},
          current: lead.toObject(),
          message: "Finance lead created via bulk upload",
        })
      )
    );

    return res.status(201).json({
      success: true,
      message: "Finance bulk upload completed",
      summary: {
        totalRows: rows.length,
        inserted: inserted.length,
        failed: errors.length,
      },
      errors,
      data: inserted,
    });
  } catch (err) {
    console.error("bulkUploadLeads error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  } finally {
    if (filePath) fs.unlink(filePath, () => {});
  }
};

// =====================================================
// ✅ ADMIN DASHBOARD (login = CLOSED)
// Only: admin, superadmin
// GET /api/finance-leads/dashboard
// =====================================================



// =====================================================
// ✅ FINANCE DASHBOARD (ADMIN / SUPERADMIN ONLY)
// =====================================================
// =====================================================
// ✅ FINANCE DASHBOARD (ADMIN / SUPERADMIN ONLY)
// =====================================================

exports.getFinanceDashboard = async (req, res) => {
  try {
    /* ==========================
       ROLE CHECK
    ========================== */
   

    const now = new Date();

    /* ==========================
       MONTH RANGES (CARDS)
    ========================== */

    const currMonthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const currMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const prevMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const prevMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59
    );

    /* ==========================
       % CHANGE HELPER
    ========================== */
    const calcChange = (curr, prev) => {
      if (prev === 0 && curr > 0) return 100;
      if (prev === 0) return 0;

      return Number(
        (((curr - prev) / prev) * 100).toFixed(1)
      );
    };

    /* ==========================
       COMMON AGG (CARDS)
    ========================== */
    const buildAgg = (start, end) => [
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },

      {
        $group: {
          _id: null,

          // Loan Applications
          total: { $sum: 1 },

          // Active Deals
          active: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    ["Interested", "Busy"],
                  ],
                },
                1,
                0,
              ],
            },
          },

          // Logged In
          loggedIn: {
            $sum: {
              $cond: [
                { $eq: ["$status", "login"] },
                1,
                0,
              ],
            },
          },

          // Pending
          pending: {
            $sum: {
              $cond: [
                { $eq: ["$status", "Follow up"] },
                1,
                0,
              ],
            },
          },
        },
      },
    ];

    /* ==========================
       MONTHLY AGG
    ========================== */
    const [currAgg, prevAgg] = await Promise.all([
      FinanceLead.aggregate(
        buildAgg(currMonthStart, currMonthEnd)
      ),

      FinanceLead.aggregate(
        buildAgg(prevMonthStart, prevMonthEnd)
      ),
    ]);

    const curr = currAgg[0] || {
      total: 0,
      active: 0,
      loggedIn: 0,
      pending: 0,
    };

    const prev = prevAgg[0] || {
      total: 0,
      active: 0,
      loggedIn: 0,
      pending: 0,
    };

    /* ==========================
       CONVERSION (LOGIN / TOTAL)
    ========================== */
    const currConv =
      curr.total === 0
        ? 0
        : Number(
            (
              (curr.loggedIn / curr.total) *
              100
            ).toFixed(1)
          );

    const prevConv =
      prev.total === 0
        ? 0
        : Number(
            (
              (prev.loggedIn / prev.total) *
              100
            ).toFixed(1)
          );

    /* ==========================
       DATE RANGES (TABS)
    ========================== */

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);

    const monthStart = currMonthStart;

    const yearStart = new Date(
      now.getFullYear(),
      0,
      1
    );

    /* ==========================
       PERFORMANCE BUILDER
    ========================== */
    const buildPerformance = (start, format) =>
      FinanceLead.aggregate([
        {
          $match: {
            createdAt: { $gte: start },
          },
        },

        {
          $group: {
            _id: {
              $dateToString: {
                format,
                date: "$createdAt",
              },
            },

            leads: { $sum: 1 },

            loggedIn: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "login"] },
                  1,
                  0,
                ],
              },
            },
          },
        },

        { $sort: { _id: 1 } },
      ]);

    /* ==========================
       SOURCES BUILDER
    ========================== */
    const buildSources = (start) =>
      FinanceLead.aggregate([
        {
          $match: {
            createdAt: { $gte: start },
          },
        },

        {
          $group: {
            _id: {
              $ifNull: ["$source", "Other"],
            },

            count: { $sum: 1 },
          },
        },

        { $sort: { count: -1 } },
      ]);

    /* ==========================
       RUN PARALLEL
    ========================== */
    const [
      dailyPerf,
      weeklyPerf,
      monthlyPerf,
      yearlyPerf,

      dailySrc,
      weeklySrc,
      monthlySrc,
      yearlySrc,
    ] = await Promise.all([
      buildPerformance(todayStart, "%H"),
      buildPerformance(weekStart, "%Y-%m-%d"),
      buildPerformance(monthStart, "%Y-%m"),
      buildPerformance(yearStart, "%Y"),

      buildSources(todayStart),
      buildSources(weekStart),
      buildSources(monthStart),
      buildSources(yearStart),
    ]);

    /* ==========================
       RECENT LEADS
    ========================== */
    const recentLeads = await FinanceLead.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "clientName contactNumber email loanRequirement location source status createdAt"
      );

    /* ==========================
       RESPONSE (UI MATCHED)
    ========================== */
    return res.json({
      success: true,

      cards: {
        loanApplications: {
          value: curr.total,
          change: calcChange(
            curr.total,
            prev.total
          ),
        },

        activeDeals: {
          value: curr.active,
          change: calcChange(
            curr.active,
            prev.active
          ),
        },

        loggedIn: {
          value: curr.loggedIn,
          change: calcChange(
            curr.loggedIn,
            prev.loggedIn
          ),
        },

        pendingTasks: {
          value: curr.pending,
          change: calcChange(
            curr.pending,
            prev.pending
          ),
        },

        conversionRate: {
          value: currConv,
          change: calcChange(
            currConv,
            prevConv
          ),
        },
      },

      performance: {
        daily: dailyPerf,
        weekly: weeklyPerf,
        monthly: monthlyPerf,
        yearly: yearlyPerf,
      },

      sources: {
        daily: dailySrc,
        weekly: weeklySrc,
        monthly: monthlySrc,
        yearly: yearlySrc,
      },

      recentLeads,
    });
  } catch (err) {
    console.error("Finance Dashboard Error:", err);

    return res.status(500).json({
      success: false,
      message: "Dashboard server error",
    });
  }
};




