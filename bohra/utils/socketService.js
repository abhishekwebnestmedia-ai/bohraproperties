/**
 * ✅ Socket.io Real-time Notification Service
 * Emits notifications to users in real-time
 */

const Notification = require("../models/notification");
const User = require("../models/user");

/**
 * Deduplicate an array of user IDs (handles ObjectIds and strings)
 */
function dedupeUserIds(ids) {
  const seen = new Set();
  return ids.filter((id) => {
    if (!id) return false;
    const key = String(id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Get global io instance
 */
function getIO() {
  return global.io;
}

/**
 * Emit to single user
 */
function emitToUser(userId, event, payload) {
  if (!userId) return;
  const io = getIO();
  if (!io) {
    console.warn(`[socketService] io not available — cannot emit "${event}" to ${userId}`);
    return;
  }
  
  const room = String(userId);
  const sockets = io.sockets.adapter.rooms.get(room);
  if (!sockets || sockets.size === 0) {
    console.warn(`[socketService] No sockets in room "${room}" — user offline? Event: "${event}"`);
  } else {
    console.log(`[socketService] Emitting "${event}" to room "${room}" (${sockets.size} socket(s))`);
  }
  
  io.to(room).emit(event, payload);
}

/**
 * Emit to multiple users (auto-deduplicates)
 */
function emitToUsers(userIds, event, payload) {
  if (!Array.isArray(userIds)) return;
  dedupeUserIds(userIds).forEach(userId => emitToUser(userId, event, payload));
}

/**
 * Emit to all admins
 */
function emitToAdmins(event, payload) {
  const io = getIO();
  if (!io) return;
  
  io.to("admins").emit(event, payload);
}

/**
 * Emit to admin and all relevant users
 */
function emitToAdminsAndUser(userId, event, payload) {
  emitToUser(userId, event, payload);
  emitToAdmins(event, payload);
}

/**
 * Create & emit notification to single user
 */
async function notifyUser(userId, { title, message, type, refId, createdBy }) {
  if (!userId) return;

  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    refId,
    createdBy,
  });

  emitToUser(userId, "notification:new", {
    id: notification._id,
    title,
    message,
    type,
    refId,
    createdAt: notification.createdAt,
  });

  return notification;
}

/**
 * Create & emit notification to multiple users (auto-deduplicates)
 */
async function notifyUsers(userIds, { title, message, type, refId, createdBy }) {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];

  const uniqueIds = dedupeUserIds(userIds);
  const notifications = [];
  
  for (const userId of uniqueIds) {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      refId,
      createdBy,
    });
    
    notifications.push(notification);
    
    emitToUser(userId, "notification:new", {
      id: notification._id,
      title,
      message,
      type,
      refId,
      createdAt: notification.createdAt,
    });
  }

  return notifications;
}

/**
 * Notify on lead followup set/changed
 * Creates DB notifications + emits notification:new (one per unique user)
 */
async function notifyLeadFollowup(lead, { createdBy, teamLead, relationshipManager }) {
  const userIds = [];
  const leadDomain = lead.type || "property";
  // Superadmins see all; admins only see notifications for their own domain
  const admins = await User.find({
    $or: [
      { role: "superadmin" },
      { role: "admin", domain: leadDomain },
    ],
  }).select("_id");

  if (createdBy) userIds.push(createdBy);
  if (teamLead) userIds.push(teamLead);
  if (relationshipManager) userIds.push(relationshipManager);

  admins.forEach(admin => userIds.push(admin._id));

  // Deduplicate — a user who is both createdBy and admin gets only 1 notification
  const uniqueIds = dedupeUserIds(userIds);

  const message = `Follow-up scheduled for ${lead.clientName} on ${lead.followUpDate?.toLocaleDateString()}`;

  // notifyUsers already emits 'notification:new' per user — no separate emit needed
  await notifyUsers(uniqueIds, {
    title: `Lead Follow-up Scheduled`,
    message,
    type: lead.type || "property",
    refId: lead._id,
    createdBy,
  });
}

/**
 * Notify on lead status change
 */
async function notifyLeadStatusChange(lead, oldStatus, newStatus, { createdBy, teamLead }) {
  const userIds = [];

  if (createdBy) userIds.push(createdBy);
  if (teamLead) userIds.push(teamLead);

  const uniqueIds = dedupeUserIds(userIds);

  const message = `Status changed: ${oldStatus} → ${newStatus} for ${lead.clientName}`;

  await notifyUsers(uniqueIds, {
    title: `Lead Status Updated`,
    message,
    type: lead.type || "property",
    refId: lead._id,
    createdBy,
  });
}

/**
 * Notify on lead transfer (auto-deduplicates)
 */
async function notifyLeadTransfer(lead, transferFrom, transferTo, { transferredBy, teamLead }) {
  const userIds = [transferTo];
  if (transferFrom) userIds.push(transferFrom);
  if (teamLead) userIds.push(teamLead);

  const uniqueIds = dedupeUserIds(userIds);
  const message = `Lead "${lead.clientName}" transferred to you`;

  // notifyUsers already emits 'notification:new' — no separate emit needed
  await notifyUsers(uniqueIds, {
    title: `Lead Transferred`,
    message,
    type: lead.type || "property",
    refId: lead._id,
    createdBy: transferredBy,
  });
}

/**
 * Notify on task due date
 * Emits both 'notification:new' (for list) AND 'task:due-soon' (for alarm overlay)
 */
async function notifyTaskDue(task, assignedTo) {
  const userIds = dedupeUserIds([assignedTo]);

  const message = `Task due: "${task.title}" due on ${task.dueDate?.toLocaleDateString()}`;

  await notifyUsers(userIds, {
    title: `Task Due Soon`,
    message,
    type: "note",
    refId: task._id,
    createdBy: task.createdBy,
  });

  // Also emit task:due-soon so frontend can trigger the alarm overlay
  emitToUsers(userIds, "task:due-soon", {
    taskId: task._id,
    title: task.title,
    dueDate: task.dueDate,
  });
}

/**
 * Batch notify on reminder trigger (deduplicates per lead)
 * Creates DB notifications + emits BOTH notification:new AND reminder:triggered
 */
async function notifyBatchReminders(leads, type, leadType) {
  // Superadmins see all; admins only see notifications for their own domain
  const admins = await User.find({
    $or: [
      { role: "superadmin" },
      { role: "admin", domain: leadType },
    ],
  }).select("_id");
  const adminIds = admins.map(a => a._id);

  for (const lead of leads) {
    const message = `${type} reminder: ${lead.clientName}`;

    // Collect all intended recipients
    const rawIds = [lead.createdBy];
    if (lead.teamLead) rawIds.push(lead.teamLead);
    if (lead.relationshipManager) rawIds.push(lead.relationshipManager);
    rawIds.push(...adminIds);

    // Deduplicate — each user gets exactly ONE notification per lead
    const uniqueIds = dedupeUserIds(rawIds);

    // Build notifications array for this lead
    const notificationsToCreate = uniqueIds.map(userId => ({
      user: userId,
      title: `${type} Reminder`,
      message,
      type: leadType,
      refId: lead._id,
      createdBy: lead.createdBy,
    }));

    // Batch insert for this lead
    const created = await Notification.insertMany(notificationsToCreate);

    // Emit 'notification:new' to each user (real-time — fixes "only on refresh")
    created.forEach(notification => {
      emitToUser(notification.user, "notification:new", {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        refId: notification.refId,
        createdAt: notification.createdAt,
      });
    });

    // Also emit 'reminder:triggered' so frontend triggers alarm overlay
    emitToUsers(uniqueIds, "reminder:triggered", {
      leadId: lead._id,
      clientName: lead.clientName,
      type: leadType,
      message,
    });
  }
}

module.exports = {
  getIO,
  emitToUser,
  emitToUsers,
  emitToAdmins,
  emitToAdminsAndUser,
  notifyUser,
  notifyUsers,
  notifyLeadFollowup,
  notifyLeadStatusChange,
  notifyLeadTransfer,
  notifyTaskDue,
  notifyBatchReminders,
};
