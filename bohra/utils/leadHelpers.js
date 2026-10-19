/**
 * ✅ Shared Lead Helper Functions
 * Eliminates duplication across property & finance controllers
 */

const User = require("../models/user");
const mongoose = require("mongoose");

/**
 * Pick specific keys from object
 */
const pick = (obj, keys) => {
  const out = {};
  keys.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  });
  return out;
};

/**
 * Normalize phone to 10 digits
 */
function normalizePhone(phone) {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "");
}

/**
 * Parse date string to UTC (considering IST input)
 * Supports: "2026-01-25", "2026-01-25 18:30", ISO string
 */
function parseISTDateTime(input) {
  if (!input) return null;

  if (input instanceof Date) return input;

  const str = String(input).trim();
  if (!str) return null;

  // ISO format with timezone
  if (
    typeof input === "string" &&
    input.includes("T") &&
    (input.includes("+") || input.includes("Z"))
  ) {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  // "YYYY-MM-DD" => IST 00:00
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(`${str}T00:00:00+05:30`);
    return isNaN(d.getTime()) ? null : d;
  }

  // "YYYY-MM-DD HH:MM" => IST time
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(str)) {
    const d = new Date(str.replace(" ", "T") + ":00+05:30");
    return isNaN(d.getTime()) ? null : d;
  }

  // Try generic parse
  const dt = new Date(str);
  return isNaN(dt.getTime()) ? null : dt;
}

/**
 * Format date to IST string
 */
function formatIST(date) {
  if (!date) return date;
  const dt = new Date(date);
  const istTime = new Date(dt.getTime() + 330 * 60 * 1000);
  return istTime.toISOString().replace("Z", "+05:30");
}

/**
 * Escape regex special characters
 */
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Resolve single user by name
 */
async function resolveUserIdByName(name, extraFilter = {}) {
  if (!name || typeof name !== "string") return null;

  const user = await User.findOne({
    name: name.trim(),
    ...extraFilter,
  }).select("_id");

  return user?._id || null;
}

/**
 * Resolve multiple users by name (regex search)
 */
async function resolveUserIdsByName(name, extraFilter = {}) {
  if (!name || typeof name !== "string") return [];

  if (["null", "undefined"].includes(name.toLowerCase())) return [];

  const safe = escapeRegex(name.trim());

  const users = await User.find({
    name: { $regex: safe, $options: "i" },
    ...extraFilter,
  }).select("_id");

  return users.map((u) => u._id);
}

/**
 * Build RBAC filter for lead access
 */
async function buildLeadAccessFilter(req) {
  const { userId, role } = req.user;

  if (role === "superadmin" || role === "admin") return {};

  if (role === "employee") {
    return { createdBy: new mongoose.Types.ObjectId(userId) };
  }

  if (role === "teamlead") {
    const employees = await User.find({
      role: "employee",
      createdBy: new mongoose.Types.ObjectId(userId),
    }).select("_id");

    const employeeIds = employees.map((e) => e._id);

    return {
      $or: [
        { createdBy: new mongoose.Types.ObjectId(userId) },
        { createdBy: { $in: employeeIds } },
        { teamLead: new mongoose.Types.ObjectId(userId) },
      ],
    };
  }

  return { createdBy: new mongoose.Types.ObjectId(userId) };
}

/**
 * Auto-resolve team lead for employee
 */
async function resolveTeamLeadId(req) {
  const { userId, role } = req.user;

  if (role === "teamlead") return userId;

  if (role === "employee") {
    const emp = await User.findById(userId).select("createdBy");
    return emp?.createdBy || null;
  }

  return null;
}

/**
 * Record action history for audit trail
 */
async function recordHistory(HistoryModel, req, { leadId, action, previous = {}, current = {}, message = "" }) {
  const ip = req.headers["x-forwarded-for"]?.toString()?.split(",")[0]?.trim() || req.ip;
  const userAgent = req.headers["user-agent"] || "";

  await HistoryModel.create({
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

module.exports = {
  pick,
  normalizePhone,
  parseISTDateTime,
  formatIST,
  escapeRegex,
  resolveUserIdByName,
  resolveUserIdsByName,
  buildLeadAccessFilter,
  resolveTeamLeadId,
  recordHistory,
};
