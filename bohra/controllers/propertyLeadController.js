const mongoose = require("mongoose");
const fs = require("fs");

const PropertyLead = require("../models/propertyLead");
const PropertyLeadHistory = require("../models/propertyLeadHistory");
const User = require("../models/user");
const {
  notifyUser,
  notifyLeadFollowup,
  notifyLeadStatusChange,
  notifyLeadTransfer,
} = require("../utils/socketService");

const XLSX = require("xlsx");
const csvtojson = require("csvtojson");

// ✅ populate user names
const LEAD_POPULATE = [
  { path: "createdBy", select: "name email phoneNumber role employeeId" },
  { path: "teamLead", select: "name email phoneNumber role employeeId" },
  { path: "relationshipManager", select: "name email phoneNumber role employeeId" },
];

// ✅ allowed update/create fields
const LEAD_ALLOWED_FIELDS = [
  "clientName",
  "contactNumber",
  "email",
  "budget",
  "location",
  "project",
  "source",
  "followUpDate",
  "notes",
  "remarks",
  "relationshipManager",
  "teamLead",
  "stage",    // ✅ lifecycle stage (Lead / Token / Completed)
  "status",   // ✅ activity status (Follow up / Interested / etc.)

  // ✅ NEW
  "propertyType",
];

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

// -----------------------
// Helpers: sanitize history output
// -----------------------
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
    // try Buffer-style id
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

  // If object itself looks like an id/buffer -> return hex string
  const normalized = normalizeIdValue(value);
  if (typeof normalized === "string" && /^[0-9a-fA-F]{24}$/.test(normalized)) return normalized;

  const out = {};
  for (const k of Object.keys(value)) {
    out[k] = sanitizeValue(value[k]);
  }
  return out;
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

    // Skip unchanged fields and internal fields
    if (JSON.stringify(prevVal) === JSON.stringify(currVal)) continue;
    if (["_id", "__v", "createdAt", "updatedAt"].includes(key)) continue;

    // Skip nested objects for simplicity (show only primitives)
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

  // Action type display mapping
  const actionTypeMap = {
    CREATED: { type: "Created", icon: "circle", color: "green" },
    UPDATED: { type: "Updated", icon: "circle", color: "blue" },
    DELETED: { type: "Deleted", icon: "circle", color: "red" },
    STATUS_CHANGED: { type: "Status", icon: "circle", color: "green" },
    STAGE_CHANGED: { type: "Stage", icon: "circle", color: "blue" },
    FOLLOWUP_CHANGED: { type: "Follow Up", icon: "circle", color: "orange" },
    TRANSFERRED: { type: "Transfer", icon: "circle", color: "purple" },
    BULK_UPLOADED: { type: "Bulk Upload", icon: "circle", color: "blue" },
  };

  // Process each history record
  for (const record of historyRecords) {
    const userId = record.performedBy?._id || record.performedBy;
    const userKey = String(userId);

    // Initialize group if not exists
    if (!groupsMap.has(userKey)) {
      groupsMap.set(userKey, {
        user: record.performedBy || { _id: userId, name: "Unknown", email: "" },
        activities: [],
      });
    }

    const group = groupsMap.get(userKey);

    // Format timestamp (e.g., "Feb 2, 2023 | 01:50")
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

    // Extract display info for action
    const actionInfo = actionTypeMap[record.action] || {
      type: record.action,
      icon: "circle",
      color: "gray",
    };

    // Extract field-level changes
    const changes = extractChanges(record.previous, record.current);

    // Build activity object
    const activity = {
      _id: record._id,
      action: record.action,
      type: actionInfo.type,
      icon: actionInfo.icon,
      color: actionInfo.color,
      description: record.message || actionInfo.type,
      timestamp,
      createdAt: record.createdAt,
      changes, // Array of { field, previous, current }
      ip: record.ip,
      userAgent: record.userAgent,
    };

    group.activities.push(activity);
  }

  // Convert map to array and sort activities by timestamp (newest first)
  return Array.from(groupsMap.values()).map((group) => ({
    ...group,
    activities: group.activities.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    ),
  }));
}

function normalizePhone(phone) {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "");
}

/**
 * ✅ Parse FollowUpDate input as IST-aware Date
 */
function parseISTDateTime(input) {
  if (!input) return null;

  if (input instanceof Date) return input;

  const str = String(input).trim();
  if (!str) return null;

  // ISO string with timezone (keep as-is)
  if (
    str.includes("T") &&
    (str.includes("+") || str.endsWith("Z"))
  ) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // "YYYY-MM-DD" => IST midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split("-").map(Number);
    const utcMidnight = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    return new Date(utcMidnight.getTime() - 330 * 60 * 1000);
  }

  // "YYYY-MM-DD HH:mm" => IST datetime
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(str)) {
    const d = new Date(str.replace(" ", "T") + ":00+05:30");
    return isNaN(d.getTime()) ? null : d;
  }

  const dt = new Date(str);
  if (isNaN(dt.getTime())) return null;

  return dt;
}

/**
 * ✅ STRICT STAGE FLOW  (Lead → Token → Completed) + Dead terminal stage.
 * Dead is allowed from any non-Dead stage and cannot move forward afterward.
 */
function canChangeStage(currentStage, nextStage) {
  if (currentStage === nextStage) return true;
  if (currentStage === "Lead"  && nextStage === "Token")     return true;
  if (currentStage === "Token" && nextStage === "Completed") return true;
  if (["Lead", "Token", "Completed"].includes(currentStage) && nextStage === "Dead") return true;
  return false;
}

/**
 * ✅ Legacy alias kept so no existing code breaks.
 * Delegates to the old combined-status logic for any backward-compat paths.
 */
function canChangeStatus(currentStatus, nextStatus) {
  // All activity statuses are freely changeable.
  // Only Token/Completed are stage-level and go through canChangeStage.
  const STAGE_STATUSES = new Set(["Token", "Completed"]);
  if (STAGE_STATUSES.has(nextStatus)) {
    return canChangeStage(currentStatus, nextStatus);
  }
  return true;
}

// async function recordHistory(req, { leadId, action, previous = {}, current = {}, message = "" }) {
//   const ip = req.headers["x-forwarded-for"]?.toString()?.split(",")[0]?.trim() || req.ip;
//   const userAgent = req.headers["user-agent"] || "";

//   await PropertyLeadHistory.create({
//     leadId,
//     action,
//     performedBy: req.user.userId,
//     previous,
//     current,
//     message,
//     ip,
//     userAgent,
//   });
// }

// ✅ Resolve user by name

async function recordHistory(
  req,
  { leadId, action, previous = {}, current = {}, message = "" }
) {
  const ip =
    req.headers["x-forwarded-for"]?.toString()?.split(",")[0]?.trim() ||
    req.ip;

  const userAgent = req.headers["user-agent"] || "";

  // ✅ IMPORTANT FIX: support both auth payload styles
  const performedBy = req.user?.userId || req.user?._id;

  if (!performedBy) {
    console.error("History not saved: performedBy missing", req.user);
    return; // prevent crash
  }

  await PropertyLeadHistory.create({
    leadId,
    action,
    performedBy,
    previous,
    current,
    message,
    ip,
    userAgent,
  });
}


async function resolveUserIdByName(name, extraFilter = {}) {
  if (!name || typeof name !== "string") return null;

  const user = await User.findOne({
    name: name.trim(),
    ...extraFilter,
  }).select("_id");

  return user?._id || null;
}

// ✅ RBAC filter builder
async function buildLeadAccessFilter(req) {
  const { userId, role } = req.user;
  const normalizedRole = String(role || "").toLowerCase();
  const currentUserId = new mongoose.Types.ObjectId(userId);

  if (normalizedRole === "superadmin" || normalizedRole === "admin") return {};

  // Employees should only see leads assigned to them as Relationship Manager.
  if (normalizedRole === "employee") {
    return { relationshipManager: currentUserId };
  }

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

// Backward compatibility: transferToName is treated as relationshipManagerName.
async function resolveRelationshipManagerAlias(req) {
  if (req.body.transferToName && !req.body.relationshipManagerName && !req.body.relationshipManager) {
    const toId = await resolveUserIdByName(req.body.transferToName);
    if (!toId) throw new Error(`transferToName not found: ${req.body.transferToName}`);
    req.body.relationshipManager = toId;
  }
  if (req.body.transferTo && !req.body.relationshipManager) {
    req.body.relationshipManager = req.body.transferTo;
  }
}

// =====================================================
// ✅ CREATE PROPERTY LEAD
// POST /api/pleads
// =====================================================
exports.createLead = async (req, res) => {
  try {
    const { userId } = req.user;
    const autoTeamLead = await resolveTeamLeadId(req);

    // ✅ relationshipManagerName support
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

    // ✅ teamLeadName support
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

    // Backward compatibility for legacy transferTo fields.
    try {
      await resolveRelationshipManagerAlias(req);
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }

    const payload = pick(req.body, LEAD_ALLOWED_FIELDS);

    if (payload.contactNumber) payload.contactNumber = normalizePhone(payload.contactNumber);

    if (payload.followUpDate) {
      const parsed = parseISTDateTime(payload.followUpDate);
      if (!parsed) {
        return res.status(400).json({ success: false, message: "Invalid followUpDate format" });
      }
      payload.followUpDate = parsed;
    }

    // ✅ prevent stage-like values inside activity status
    if (req.body.status === "Completed" || req.body.status === "Dead") {
      return res.status(400).json({
        success: false,
        message: "Completed/Dead are lifecycle stages. Use stage flow endpoint instead.",
      });
    }

    const now = new Date();

    const lead = await PropertyLead.create({
      ...payload,
      status: req.body.status || "Follow up",
      createdBy: userId,
      teamLead: payload.teamLead || autoTeamLead,
      transferDate: payload.relationshipManager ? now : null,
    });

    await recordHistory(req, {
      leadId: lead._id,
      action: "CREATED",
      previous: {},
      current: lead.toObject(),
      message: "Property lead created",
    });

    if (payload.relationshipManager) {
      await recordHistory(req, {
        leadId: lead._id,
        action: "TRANSFERRED",
        previous: { relationshipManager: null, transferDate: null },
        current: { relationshipManager: payload.relationshipManager, transferDate: now },
        message: "Lead relationship manager assigned during creation",
      });
    }

    const populated = await PropertyLead.findById(lead._id).populate(LEAD_POPULATE);

    // Notify relevant users about new lead
    try {
      const notifyIds = [userId];
      if (payload.teamLead || autoTeamLead) notifyIds.push(String(payload.teamLead || autoTeamLead));
      if (payload.relationshipManager) {
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
      message: "Property lead created successfully",
      data: populated,
    });
  } catch (err) {
    console.error("createLead error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================================================
// ✅ GET PROPERTY LEADS
// =====================================================

// ✅ Resolve user by name (case-insensitive + partial)



// ✅ Resolve user by name


/// get lead 
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
    message: "No leads found",

    meta: {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },

    data: [],
  });
}



/* =====================================================
   HELPER: Resolve MULTIPLE user names → user IDs
   Supports: "Name1,Name2,Name3"
===================================================== */
async function resolveMultipleUserIds(param, extraFilter = {}) {
  if (!param || typeof param !== "string") return [];

  const names = param
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  if (!names.length) return [];

  const results = await Promise.all(
    names.map((name) => resolveUserIdsByName(name, extraFilter))
  );

  return results.flat();
}

/* =====================================================
   GET LEADS (FINAL VERSION)
===================================================== */



/* =====================================================
   HELPER: Resolve MULTIPLE user names → user IDs
   Supports: "Name1,Name2,Name3"
===================================================== */
async function resolveMultipleUserIds(param, extraFilter = {}) {
  if (!param || typeof param !== "string") return [];

  const names = param
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  if (!names.length) return [];

  const results = await Promise.all(
    names.map((name) => resolveUserIdsByName(name, extraFilter))
  );

  return results.flat();
}

/* =====================================================
   GET LEADS (FINAL VERSION)
===================================================== */
// exports.getLeads = async (req, res) => {
//   try {
//     /* ================= ACCESS CONTROL ================= */
//     const accessFilter = await buildLeadAccessFilter(req);

//     /* ================= POPULATE ================= */

//     const LEAD_POPULATE = [
//       { path: "createdBy", select: "name email phoneNumber role employeeId" },
//       { path: "teamLead", select: "name email phoneNumber role employeeId" },
//       { path: "relationshipManager", select: "name email phoneNumber role employeeId" },
//     ];

//     /* ================= CLEAN QUERY ================= */

//     Object.keys(req.query).forEach((k) => {
//       if (typeof req.query[k] === "string") {
//         req.query[k] = req.query[k].trim();
//       }
//     });

//     const {
//       page = 1,
//       limit = 10,

//       status,
//       search,

//       sortBy = "createdAt",
//       order = "desc",

//       teamLead,
//       employee,
//       rm,
//       transferTo,

//       unassigned,
//       from,
//       to,
//       followFrom,
//       followTo,
//       activityStatus,
//     } = req.query;

//     /* ================= PAGINATION ================= */

//     const pageNum = Math.max(Number(page) || 1, 1);
//     const limitNum = Math.max(Number(limit) || 10, 1);
//     const skip = (pageNum - 1) * limitNum;

//     /* ================= BASE FILTER ================= */

//     const filter = { ...accessFilter };

//     /* ================= STATUS / STAGE (tab) ================= */

//     /**
//      * `status` query param = the ACTIVE TAB in the UI:
//      *   "Leads"     → stage = "Lead"
//      *   "Token"     → stage = "Token"
//      *   "Completed" → stage = "Completed"
//      *   anything else / undefined → all stages
//      */
//     if (!status || status === "All") {
//       // no stage filter → return everything
//     } else if (status === "Leads") {
//       filter.stage = "Lead";
//     } else if (status === "Token") {
//       filter.stage = "Token";
//     } else if (status === "Completed") {
//       filter.stage = "Completed";
//     } else {
//       // Comma-separated activity statuses from the widget filter
//       const statuses = status.split(",").map((s) => s.trim()).filter(Boolean);
//       if (statuses.length === 1) {
//         filter.status = statuses[0];
//       } else {
//         filter.status = { $in: statuses };
//       }
//     }

//     /* ================= ACTIVITY STATUS FILTER ================= */
//     // Separate from the tab filter above — allows filtering by status WITHIN a stage tab
//     if (activityStatus) {
//       const statuses = activityStatus.split(",").map((s) => s.trim()).filter(Boolean);
//       if (statuses.length === 1) {
//         filter.status = statuses[0];
//       } else {
//         filter.status = { $in: statuses };
//       }
//     }

//     /* ================= SEARCH ================= */

//     if (search && search.length >= 2) {
//       // Wrap in double quotes for exact phrase matching (MongoDB $text)
//       const safeSearch = search.trim().replace(/"/g, '');
//       filter.$text = { $search: `"${safeSearch}"` };
//     }

//     /* ================= MULTI NAME → IDS ================= */

//     const [teamLeadIds, employeeIds, rmIds, transferIds] = await Promise.all([
//       resolveMultipleUserIds(teamLead, {
//         $or: [{ role: "teamlead" }, { designation: "teamlead" }],
//       }),
//       resolveMultipleUserIds(employee),
//       resolveMultipleUserIds(rm),
//       resolveMultipleUserIds(transferTo),
//     ]);

//     /* ================= EMPTY GUARD ================= */

//     if (teamLead && !teamLeadIds.length) return empty(res, pageNum, limitNum);
//     if (employee && !employeeIds.length) return empty(res, pageNum, limitNum);
//     if (rm && !rmIds.length) return empty(res, pageNum, limitNum);
//     if (transferTo && !transferIds.length) return empty(res, pageNum, limitNum);

//     /* ================= APPLY FILTERS ================= */

//     if (teamLeadIds.length) filter.teamLead = { $in: teamLeadIds };
//     if (employeeIds.length) filter.createdBy = { $in: employeeIds };
//     if (rmIds.length) filter.relationshipManager = { $in: rmIds };
//     if (transferIds.length) {
//       filter.relationshipManager = filter.relationshipManager
//         ? { $in: [...new Set([...(filter.relationshipManager.$in || []), ...transferIds])] }
//         : { $in: transferIds };
//     }

//     if (unassigned === "true") {
//       filter.relationshipManager = null;
//     }

//     /* ================= DATE FILTERS ================= */

//     if (from || to) {
//       filter.createdAt = {};
//       if (from) filter.createdAt.$gte = new Date(from);
//       if (to) filter.createdAt.$lte = new Date(to);
//     }

//     if (followFrom || followTo) {
//       filter.followUpDate = {};
//       if (followFrom) filter.followUpDate.$gte = new Date(followFrom);
//       if (followTo) filter.followUpDate.$lte = new Date(followTo);
//     }

//     /* ================= SORT ================= */

//     const sort = {
//       [sortBy]: order === "asc" ? 1 : -1,
//       _id: -1,
//     };

//     /* ================= QUERY ================= */

//     const [total, leads] = await Promise.all([
//       PropertyLead.countDocuments(filter),
//       PropertyLead.find(filter)
//         .sort(sort)
//         .skip(skip)
//         .limit(limitNum)
//         .populate(LEAD_POPULATE),
//     ]);

//     /* ================= RESPONSE ================= */

//     return res.status(200).json({
//       success: true,
//       message: "Property leads fetched successfully",
//       meta: {
//         page: pageNum,
//         limit: limitNum,
//         total,
//         totalPages: Math.ceil(total / limitNum),
//       },
//       data: leads,
//     });

//   } catch (err) {
//     console.error("getLeads error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

exports.getLeads = async (req, res) => {
  try {
    /* ================= ACCESS CONTROL ================= */
    const accessFilter = await buildLeadAccessFilter(req);

    /* ================= POPULATE ================= */
    const LEAD_POPULATE = [
      { path: "createdBy", select: "name email phoneNumber role employeeId" },
      { path: "teamLead", select: "name email phoneNumber role employeeId" },
      { path: "relationshipManager", select: "name email phoneNumber role employeeId" },
    ];

    /* ================= CLEAN QUERY ================= */
    Object.keys(req.query).forEach((k) => {
      if (typeof req.query[k] === "string") {
        req.query[k] = req.query[k].trim();
      }
    });

    const {
      page = 1,
      limit = 10,

      status, // stage (tab)
      search,

      sortBy = "createdAt",
      order = "desc",

      teamLead,
      employee,
      rm,
      transferTo,

      unassigned,
      from,
      to,
      followFrom,
      followTo,
      activityStatus,
    } = req.query;

    /* ================= PAGINATION ================= */
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.max(Number(limit) || 10, 1);
    const skip = (pageNum - 1) * limitNum;

    /* ================= BASE FILTER ================= */
    const filter = { ...accessFilter };

    /* ================= STAGE FILTER ================= */
    if (status && status !== "All") {
      if (status === "Leads") {
        filter.stage = "Lead";
      } else if (status === "Token") {
        filter.stage = "Token";
      } else if (status === "Completed") {
        filter.stage = "Completed";
      } else if (status === "Dead") {
        // Backward-compatible: include legacy records where Dead was stored as activity status.
        filter.$or = [
          { stage: "Dead" },
          { status: { $regex: /^\s*dead\s*$/i } },
        ];
      }
    }

    const hideDeadInTab = status === "Leads" || status === "Token";

    /* ================= ACTIVITY STATUS ================= */
    if (activityStatus) {
      let statuses = activityStatus
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      // 🔥 HARD RULE ENFORCEMENT
      if (hideDeadInTab) {
        statuses = statuses.filter((s) => s.toLowerCase() !== "dead");
      }

      if (statuses.length === 0) {
        return empty(res, pageNum, limitNum);
      }

      filter.status =
        statuses.length === 1 ? statuses[0] : { $in: statuses };
    }

    /* ================= 🔥 GLOBAL HARD CONSTRAINT ================= */
    // This ensures rule ALWAYS applies, even if something slips above
    if (hideDeadInTab) {
      filter.$and = filter.$and || [];
      filter.$and.push({ status: { $not: /^\s*dead\s*$/i } });
    }

    /* ================= SEARCH ================= */
    if (search && search.length >= 2) {
      const safeSearch = search.replace(/"/g, "");
      filter.$text = { $search: `"${safeSearch}"` };
    }

    /* ================= MULTI NAME → IDS ================= */
    const [teamLeadIds, employeeIds, rmIds, transferIds] = await Promise.all([
      resolveMultipleUserIds(teamLead, {
        $or: [{ role: "teamlead" }, { designation: "teamlead" }],
      }),
      resolveMultipleUserIds(employee),
      resolveMultipleUserIds(rm),
      resolveMultipleUserIds(transferTo),
    ]);

    /* ================= EMPTY GUARD ================= */
    if (teamLead && !teamLeadIds.length) return empty(res, pageNum, limitNum);
    if (employee && !employeeIds.length) return empty(res, pageNum, limitNum);
    if (rm && !rmIds.length) return empty(res, pageNum, limitNum);
    if (transferTo && !transferIds.length) return empty(res, pageNum, limitNum);

    /* ================= APPLY USER FILTERS ================= */
    if (teamLeadIds.length) filter.teamLead = { $in: teamLeadIds };
    if (employeeIds.length) filter.createdBy = { $in: employeeIds };
    if (rmIds.length) filter.relationshipManager = { $in: rmIds };

    if (transferIds.length) {
      filter.relationshipManager = filter.relationshipManager
        ? {
            $in: [
              ...new Set([
                ...(filter.relationshipManager.$in || []),
                ...transferIds,
              ]),
            ],
          }
        : { $in: transferIds };
    }

    if (unassigned === "true") {
      filter.relationshipManager = null;
    }

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
    const sort = {
      [sortBy]: order === "asc" ? 1 : -1,
      _id: -1,
    };

    /* ================= QUERY ================= */
    const [total, leads] = await Promise.all([
      PropertyLead.countDocuments(filter),
      PropertyLead.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate(LEAD_POPULATE),
    ]);

    /* ================= RESPONSE ================= */
    return res.status(200).json({
      success: true,
      message: "Property leads fetched successfully",
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      data: leads,
    });

  } catch (err) {
    console.error("getLeads error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
/* ================= EMPTY RESPONSE ================= */

function empty(res, page, limit) {
  return res.status(200).json({
    success: true,
    message: "No leads found",
    meta: {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
    data: [],
  });
}


/* ================= EMPTY RESPONSE ================= */

function empty(res, page, limit) {
  return res.status(200).json({
    success: true,
    message: "No leads found",
    meta: {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
    data: [],
  });
}


/* ---------------- EMPTY RESULT HELPER ---------------- */

function empty(res, page, limit) {
  return res.status(200).json({
    success: true,
    message: "No leads found",

    meta: {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },

    data: [],
  });
}



// =====================================================
// ✅ GET SINGLE PROPERTY LEAD
// =====================================================
exports.getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const accessFilter = await buildLeadAccessFilter(req);

    const lead = await PropertyLead.findOne({ _id: id, ...accessFilter }).populate(LEAD_POPULATE);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Property lead not found / not authorized",
      });
    }

    return res.status(200).json({ success: true, data: lead });
  } catch (err) {
    console.error("getLeadById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



exports.updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const accessFilter = await buildLeadAccessFilter(req);

    const oldLead = await PropertyLead
      .findOne({ _id: id, ...accessFilter })
      .populate(LEAD_POPULATE);

    if (!oldLead) {
      return res.status(404).json({
        success: false,
        message: "Property lead not found / not authorized",
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

    try {
      await resolveRelationshipManagerAlias(req);
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }

    /* ---------------- ALLOWED UPDATES ---------------- */

    const updates = pick(req.body, LEAD_ALLOWED_FIELDS);

    if (updates.contactNumber) {
      updates.contactNumber = normalizePhone(updates.contactNumber);
    }

    if (updates.followUpDate) {
      const parsed = parseISTDateTime(updates.followUpDate);

      if (!parsed) {
        return res.status(400).json({
          success: false,
          message: "Invalid followUpDate format in propertylead",
        });
      }

      updates.followUpDate = parsed;
      updates.reminderSent = false; // reset reminder
    }

    /* ---------------- TRANSFER TRACKING ---------------- */

    const now = new Date();

    const oldTransferTo = oldLead.relationshipManager?._id
      ? String(oldLead.relationshipManager._id)
      : null;

    const newTransferTo = updates.relationshipManager
      ? String(updates.relationshipManager)
      : null;

    const transferChanged = newTransferTo && newTransferTo !== oldTransferTo;

    if (transferChanged) {
      updates.transferDate = now;
    }

    /* ---------------- UPDATE ---------------- */

    const updated = await PropertyLead.findOneAndUpdate(
      { _id: id, ...accessFilter },
      { $set: updates },
      { new: true }
    ).populate(LEAD_POPULATE);

    /* ---------------- HISTORY ---------------- */

    await recordHistory(req, {
      leadId: id,
      action: "UPDATED",
      previous: oldLead.toObject(),
      current: updates,
      message: "Property lead updated",
    });

    if (transferChanged) {
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
        message: `Lead reassigned in update to ${updated.relationshipManager?.name || "N/A"}`,
      });
    }

    // Emit real-time notifications
    try {
      if (transferChanged) {
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
      message: "Property lead updated",
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
// ✅ UPDATE STAGE  (Lead → Token → Completed)
// PATCH /api/pleads/:id/stage
// =====================================================
exports.updateStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    const VALID_STAGES = ["Lead", "Token", "Completed", "Dead"];
    if (!stage || !VALID_STAGES.includes(stage)) {
      return res.status(400).json({
        success: false,
        message: `stage must be one of: ${VALID_STAGES.join(", ")}`
      });
    }

    const accessFilter = await buildLeadAccessFilter(req);
    const lead = await PropertyLead.findOne({ _id: id, ...accessFilter });
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Property lead not found / unauthorized",
      });
    }

    const prevStage = lead.stage || "Lead";

    if (!canChangeStage(prevStage, stage)) {
      return res.status(400).json({
        success: false,
        message: `Invalid stage flow: ${prevStage} → ${stage}. Allowed: Lead→Token, Token→Completed, and any non-Dead stage → Dead.`,
      });
    }

    lead.stage = stage;
    // When stage changes, reset activity status for terminal/non-activity stages.
    // so the team can fresh-assess the lead in the new stage.
    if (stage === "Token" || stage === "Completed" || stage === "Dead") {
      lead.status = null;
    }
    await lead.save();

    await recordHistory(req, {
      leadId: id,
      action: "STAGE_CHANGED",
      previous: { stage: prevStage },
      current:  { stage },
      message: `Stage moved ${prevStage} → ${stage}`,
    });

    const populated = await PropertyLead.findById(id).populate(LEAD_POPULATE);

    try {
      await notifyLeadStatusChange(populated, prevStage, stage, {
        createdBy: populated.createdBy?._id || req.user.userId,
        teamLead:  populated.teamLead?._id  || null,
      });
    } catch (notifErr) {
      console.error("Notification (non-blocking):", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Stage updated to ${stage}`,
      data: populated,
    });
  } catch (err) {
    console.error("updateStage error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================================================
// ✅ UPDATE STATUS  (activity / follow-up status)
// PATCH /api/pleads/:id/status
// =====================================================
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ACTIVITY_STATUSES = ["Follow up", "Interested", "Busy"];

    if (!status || !ACTIVITY_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${ACTIVITY_STATUSES.join(", ")}`,
      });
    }

    const accessFilter = await buildLeadAccessFilter(req);

    const lead = await PropertyLead.findOne({ _id: id, ...accessFilter });
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Property lead not found / unauthorized",
      });
    }

    const prevStatus = lead.status;
    lead.status = status;
    await lead.save();

    await recordHistory(req, {
      leadId: id,
      action: "STATUS_CHANGED",
      previous: { status: prevStatus },
      current: { status },
      message: `Activity status changed ${prevStatus ?? "null"} \u2192 ${status}`,
    });

    const populated = await PropertyLead.findById(id).populate(LEAD_POPULATE);

    try {
      await notifyLeadStatusChange(populated, prevStatus, status, {
        createdBy: populated.createdBy?._id || req.user.userId,
        teamLead:  populated.teamLead?._id  || null,
      });
    } catch (notifErr) {
      console.error("Notification error (non-blocking):", notifErr.message);
    }

    return res.status(200).json({ success: true, message: "Activity status updated", data: populated });
  } catch (err) {
    console.error("updateStatus error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================================================
// ✅ TRANSFER PROPERTY LEAD
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

    const oldLead = await PropertyLead.findOne({ _id: id, ...accessFilter }).populate(LEAD_POPULATE);
    if (!oldLead) {
      return res.status(404).json({
        success: false,
        message: "Property lead not found / unauthorized",
      });
    }

    const now = new Date();

    const updated = await PropertyLead.findOneAndUpdate(
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
      message: `Lead reassigned to ${updated.relationshipManager?.name || "N/A"}`,
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
// ✅ FOLLOW UP DATE UPDATE (IST FIXED)
// =====================================================
exports.updateFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { followUpDate } = req.body;

    const accessFilter = await buildLeadAccessFilter(req);

    const oldLead = await PropertyLead.findOne({ _id: id, ...accessFilter });
    if (!oldLead) {
      return res.status(404).json({
        success: false,
        message: "Property lead not found / unauthorized",
      });
    }

    const parsedFollowUp = followUpDate ? parseISTDateTime(followUpDate) : null;

    if (followUpDate && !parsedFollowUp) {
      return res.status(400).json({ success: false, message: "Invalid followUpDate format" });
    }

    const setFields = { followUpDate: parsedFollowUp };
    if (parsedFollowUp) setFields.reminderSent = false;

    const updated = await PropertyLead.findOneAndUpdate(
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
// ✅ PROPERTY LEAD HISTORY
// =====================================================

exports.getLeadHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 30 } = req.query;

    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.max(parseInt(limit, 10), 1);
    const skip = (pageNum - 1) * limitNum;

    const accessFilter = await buildLeadAccessFilter(req);

    // 1️⃣ Verify lead access & fetch relationships
    const lead = await PropertyLead.findOne({
      _id: id,
      ...accessFilter,
    }).select("_id parentLeadId relationshipManager").populate([
      { path: "relationshipManager", select: "_id" },
    ]);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found / unauthorized",
      });
    }

    // 2️⃣ Search history for BOTH base + child leads
    const leadIdsToSearch = lead.parentLeadId
      ? [lead._id, lead.parentLeadId]
      : [lead._id];

    // 3️⃣ Fetch history
    const [total, history] = await Promise.all([
      PropertyLeadHistory.countDocuments({
        leadId: { $in: leadIdsToSearch },
      }),
      PropertyLeadHistory.find({
        leadId: { $in: leadIdsToSearch },
      })
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

    // ✅ Role-based filtering with lead-related access
    const currentUserId = String(req.user?.userId || req.user?._id);
    const leadRMId = lead.relationshipManager?._id ? String(lead.relationshipManager._id) : null;

    const filteredHistory = sanitizedHistory.filter((record) => {
      const userRole = req.user?.role;
      
      // Superadmin & admin can see all activities
      if (userRole === "superadmin" || userRole === "admin") {
        return true;
      }
      
      // Employees can see activities if:
      // 1. They performed the action, OR
      // 2. They are the relationshipManager of this lead
      if (userRole === "employee") {
        const performedById = String(record.performedBy?._id || record.performedBy);
        const isOwnChange = performedById === currentUserId;
        const isRelationshipManager = currentUserId === leadRMId;
        
        return isOwnChange || isRelationshipManager;
      }
      
      // Others (teamlead, etc.) can see all for now
      return true;
    });

    // Group history by user for timeline view
    const groupedHistory = groupHistoryByUser(filteredHistory);

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
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// ✅ DELETE PROPERTY LEAD
// =====================================================
exports.deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    const accessFilter = await buildLeadAccessFilter(req);

    const lead = await PropertyLead.findOneAndDelete({ _id: id, ...accessFilter });
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Property lead not found / unauthorized",
      });
    }

    await recordHistory(req, {
      leadId: id,
      action: "DELETED",
      previous: lead.toObject(),
      current: {},
      message: "Property lead deleted",
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

    const result = await PropertyLead.deleteMany({ _id: { $in: ids } });
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
// ✅ BULK UPLOAD (WITH propertyType + IST followUpDate)
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

    const mapRow = (row) => {
      const clientName =
        row.clientName || row.ClientName || row["Client Name"] || row.name || row.Name;

      const contactNumber =
        row.contactNumber ||
        row.ContactNumber ||
        row["Contact Number"] ||
        row.phone ||
        row.Phone ||
        row.mobile;

      const relationshipManagerName =
        row.relationshipManagerName ||
        row.RelationshipManagerName ||
        row["Relationship Manager"] ||
        row.transferToName ||
        row.TransferToName ||
        row["Transfer To"] ||
        row.transferTo ||
        row.TransferTo;

      // ✅ NEW: propertyType
      const propertyType =
        row.propertyType ||
        row.PropertyType ||
        row["Property Type"] ||
        row.type ||
        row.Type ||
        "";

      return {
        clientName: clientName ? String(clientName).trim() : "",
        contactNumber: normalizePhone(contactNumber),
        email: row.email || row.Email || "",
        budget: row.budget || row.Budget || "",
        location: row.location || row.Location || "",
        project: row.project || row.Project || "",
        source: row.source || row.Source || "",
        followUpDate: row.followUpDate || row["Follow Up Date"] || null,
        status: row.status || row.Status || "Follow up",

        // ✅ NEW
        propertyType: propertyType ? String(propertyType).trim() : "",

        notes: row.notes || row.Notes || "",
        remarks: row.remarks || row.Remarks || "",
        relationshipManagerName: relationshipManagerName ? String(relationshipManagerName).trim() : "",
      };
    };

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

      if (d.status === "Completed" || d.status === "Dead") {
        errors.push({
          row: rowNo,
          error: "Completed/Dead are lifecycle stages; set stage via stage flow",
        });
        continue;
      }

      if (seenPhone.has(d.contactNumber)) {
        errors.push({ row: rowNo, error: "Duplicate phone in file" });
        continue;
      }

      seenPhone.add(d.contactNumber);

      let parsedFollowUp = null;
      if (d.followUpDate) {
        parsedFollowUp = parseISTDateTime(d.followUpDate);
        if (!parsedFollowUp) {
          errors.push({ row: rowNo, error: `Invalid followUpDate: ${d.followUpDate}` });
          continue;
        }
      }

      let relationshipManager = null;
      let transferDate = null;

      if (d.relationshipManagerName) {
        const toId = await resolveUserIdByName(d.relationshipManagerName);
        if (!toId) {
          errors.push({ row: rowNo, error: `relationshipManagerName not found: ${d.relationshipManagerName}` });
          continue;
        }
        relationshipManager = toId;
        transferDate = new Date();
      }

      docs.push({
        clientName: d.clientName,
        contactNumber: d.contactNumber,
        email: d.email,
        budget: d.budget,
        location: d.location,
        project: d.project,
        source: d.source,
        followUpDate: parsedFollowUp,
        status: d.status || "Follow up",

        // ✅ NEW
        propertyType: d.propertyType || undefined,

        notes: d.notes,
        remarks: d.remarks,

        createdBy: userId,
        teamLead,
        relationshipManager,
        transferDate,
      });
    }

    const phones = docs.map((x) => x.contactNumber);
    const existing = await PropertyLead.find({ contactNumber: { $in: phones } }).select(
      "contactNumber"
    );
    const existingSet = new Set(existing.map((e) => e.contactNumber));

    const finalDocs = [];
    for (const doc of docs) {
      if (existingSet.has(doc.contactNumber)) {
        errors.push({ row: null, error: `Duplicate in DB: ${doc.contactNumber}` });
      } else {
        finalDocs.push(doc);
      }
    }

    const inserted = await PropertyLead.insertMany(finalDocs, { ordered: false });

    await Promise.all(
      inserted.map(async (lead) => {
        await recordHistory(req, {
          leadId: lead._id,
          action: "BULK_UPLOADED",
          previous: {},
          current: lead.toObject(),
          message: "Property lead created via bulk upload",
        });

        if (lead.relationshipManager) {
          await recordHistory(req, {
            leadId: lead._id,
            action: "TRANSFERRED",
            previous: { relationshipManager: null, transferDate: null },
            current: { relationshipManager: lead.relationshipManager, transferDate: lead.transferDate },
            message: "Lead transferred during bulk upload",
          });
        }
      })
    );

    return res.status(201).json({
      success: true,
      message: "Bulk upload completed",
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
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  } finally {
    if (filePath) fs.unlink(filePath, () => {});
  }
};


// =====================================================
// ✅ PROPERTY DASHBOARD (ADMIN / SUPERADMIN ONLY)
// GET /api/pleads/dashboard
// =====================================================


exports.getPropertyDashboard = async (req, res) => {
  try {
    

    const now = new Date();
    const range = req.query.range || "yearly";

    let currStart, currEnd, prevStart, prevEnd;

    // ================= RANGE LOGIC =================

    // DAILY
    if (range === "daily") {
      currStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      currEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      prevStart = new Date(currStart);
      prevStart.setDate(prevStart.getDate() - 1);

      prevEnd = new Date(prevStart);
      prevEnd.setHours(23, 59, 59);
    }

    // WEEKLY (Last 7 Days vs Previous 7 Days)
    else if (range === "weekly") {
      currStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      currEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      prevStart = new Date(currStart);
      prevStart.setDate(prevStart.getDate() - 7);

      prevEnd = new Date(currStart);
      prevEnd.setSeconds(prevEnd.getSeconds() - 1);
    }

    // MONTHLY
    else if (range === "monthly") {
      currStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    }

    // YEARLY
    else {
      currStart = new Date(now.getFullYear(), 0, 1);
      currEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
    }

    // ================= DEFAULT STATS =================

    const EMPTY = {
      total: 0,
      active: 0,
      completed: 0,
      pending: 0,
      token: 0,
    };

    const calcChange = (curr, prev) => {
      if (prev === 0 && curr > 0) return 100;
      if (prev === 0) return 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    // ================= AGG =================

    const buildAgg = (start, end) => [
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $in: ["$status", ["Interested", "Busy"]] }, 1, 0],
            },
          },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$stage", "Completed"] }, 1, 0],
            },
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "Follow up"] }, 1, 0],
            },
          },
          token: {
            $sum: {
              $cond: [{ $eq: ["$stage", "Token"] }, 1, 0],
            },
          },
        },
      },
    ];

    const [currAgg, prevAgg] = await Promise.all([
      PropertyLead.aggregate(buildAgg(currStart, currEnd)),
      PropertyLead.aggregate(buildAgg(prevStart, prevEnd)),
    ]);

    const curr = { ...EMPTY, ...(currAgg[0] || {}) };
    const prev = { ...EMPTY, ...(prevAgg[0] || {}) };

    const currConv =
      curr.total === 0 ? 0 : Number(((curr.completed / curr.total) * 100).toFixed(1));

    const prevConv =
      prev.total === 0 ? 0 : Number(((prev.completed / prev.total) * 100).toFixed(1));

    // ================= PERFORMANCE =================

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const buildPerformance = (start, format) =>
      PropertyLead.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format, date: "$createdAt" } },
            leads: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$stage", "Completed"] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);

    const buildSources = (start) =>
      PropertyLead.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: "$source", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

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
      buildPerformance(monthStart, "%Y-%m-%d"),
      buildPerformance(yearStart, "%Y-%m"),
      buildSources(todayStart),
      buildSources(weekStart),
      buildSources(monthStart),
      buildSources(yearStart),
    ]);

    const recentLeads = await PropertyLead.find()
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      range,
      cards: {
        totalLeads: { value: curr.total, change: calcChange(curr.total, prev.total) },
        activeDeals: { value: curr.active, change: calcChange(curr.active, prev.active) },
        completed: { value: curr.completed, change: calcChange(curr.completed, prev.completed) },
        pending: { value: curr.pending, change: calcChange(curr.pending, prev.pending) },
        token: { value: curr.token, change: calcChange(curr.token, prev.token) },
        conversionRate: { value: currConv, change: calcChange(currConv, prevConv) },
      },
      performance: { daily: dailyPerf, weekly: weeklyPerf, monthly: monthlyPerf, yearly: yearlyPerf },
      sources: { daily: dailySrc, weekly: weeklySrc, monthly: monthlySrc, yearly: yearlySrc },
      recentLeads,
    });

  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ success: false, message: "Dashboard server error" });
  }
};




// =====================================================
// ✅ BULK TRANSFER PROPERTY LEADS
// PATCH /api/pleads/bulk-transfer
// =====================================================
exports.bulkTransferLeads = async (req, res) => {
  try {
    let { leadIds, relationshipManager, relationshipManagerName, transferTo, transferToName } = req.body;

    if (!relationshipManager && transferTo) relationshipManager = transferTo;
    if (!relationshipManagerName && transferToName) relationshipManagerName = transferToName;

    // ---------- Validate Lead IDs ----------
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "leadIds array is required",
      });
    }

    // ---------- Resolve Name -> ID ----------
    if (!relationshipManager && relationshipManagerName) {
      relationshipManager = await resolveUserIdByName(relationshipManagerName);
      if (!relationshipManager) {
        return res.status(400).json({
          success: false,
          message: `relationshipManagerName not found: ${relationshipManagerName}`,
        });
      }
    }

    if (!relationshipManager) {
      return res.status(400).json({
        success: false,
        message: "relationshipManager OR relationshipManagerName is required",
      });
    }

    // ---------- Access Filter ----------
    const accessFilter = await buildLeadAccessFilter(req);

    // ---------- Fetch Allowed Leads ----------
    const leads = await PropertyLead.find({
      _id: { $in: leadIds },
      ...accessFilter,
    }).populate(LEAD_POPULATE);

    if (!leads.length) {
      return res.status(404).json({
        success: false,
        message: "No accessible leads found",
      });
    }

    const now = new Date();

    // ---------- Bulk Update ----------
    await PropertyLead.updateMany(
      {
        _id: { $in: leads.map((l) => l._id) },
        ...accessFilter,
      },
      {
        $set: {
          relationshipManager,
          transferDate: now,
        },
      }
    );

    // ---------- Fetch Updated ----------
    const updatedLeads = await PropertyLead.find({
      _id: { $in: leads.map((l) => l._id) },
    }).populate(LEAD_POPULATE);

    // ---------- History Recording ----------
    await Promise.all(
      leads.map(async (oldLead) => {
        const updatedLead = updatedLeads.find(
          (u) => String(u._id) === String(oldLead._id)
        );

        await recordHistory(req, {
          leadId: oldLead._id,
          action: "TRANSFERRED",
          previous: {
            relationshipManager: oldLead.relationshipManager?._id || null,
            relationshipManagerName: oldLead.relationshipManager?.name || null,
            transferDate: oldLead.transferDate || null,
          },
          current: {
            relationshipManager: updatedLead.relationshipManager?._id || null,
            relationshipManagerName: updatedLead.relationshipManager?.name || null,
            transferDate: now,
          },
          message: `Lead bulk reassigned to ${
            updatedLead.relationshipManager?.name || "N/A"
          }`,
        });
      })
    );

    return res.status(200).json({
      success: true,
      message: "Bulk transfer completed",
      totalRequested: leadIds.length,
      totalUpdated: updatedLeads.length,
      data: updatedLeads,
    });
  } catch (err) {
    console.error("bulkTransferLeads error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
