/**
 * Cron job: emit real-time reminders when followUpDate (leads) or dueDate (task notes) is due.
 * Runs every second and only triggers when the stored time falls within the last 1-second window.
 *
 * Important:
 * - If the server is down at the exact time, this "exact match" strategy will miss that reminder.
 */

const cron = require("node-cron");
const mongoose = require("mongoose");

const FinanceLead = require("../models/financeLead");
const PropertyLead = require("../models/propertyLead");
const TaskNote = require("../models/taskNote");
const { notifyBatchReminders, notifyTaskDue } = require("../utils/socketService");

// Run every second (node-cron supports seconds when using 6 fields)
const CRON_SCHEDULE = "* * * * * *";

let lastRunAt = null;
let isRunning = false;

async function runReminderJob() {
  if (isRunning) return;
  isRunning = true;

  try {
    const now = new Date();
    const windowStart = lastRunAt ? lastRunAt : new Date(now.getTime() - 1000);
    lastRunAt = now;

    const [financeLeads, propertyLeads, notes] = await Promise.all([
      FinanceLead.find({
        followUpDate: { $gt: windowStart, $lte: now },
        reminderSent: false,
      })
        .select("_id clientName createdBy teamLead relationshipManager")
        .lean(),

      PropertyLead.find({
        followUpDate: { $gt: windowStart, $lte: now },
        reminderSent: false,
      })
        .select("_id clientName createdBy teamLead  transferTo")
        .lean(),

      TaskNote.find({
        dueDate: { $gt: windowStart, $lte: now }, 
        reminderSent: false,
      })
        .select("_id title dueDate createdBy")
        .lean(),
    ]);

    // Log when tasks are found
    if (financeLeads.length || propertyLeads.length || notes.length) {
      console.log(`\n📬 [Cron] Found reminders: Finance=${financeLeads.length}, Property=${propertyLeads.length}, Tasks=${notes.length}`);
    }

    if (financeLeads.length) {
      console.log(`  ✅ Notifying ${financeLeads.length} finance leads`);
      await notifyBatchReminders(financeLeads, "Follow-up", "finance");
      await FinanceLead.updateMany(
        { _id: { $in: financeLeads.map((l) => l._id) } },
        { $set: { reminderSent: true } }
      );
    }

    if (propertyLeads.length) {
      console.log(`  ✅ Notifying ${propertyLeads.length} property leads`);
      await notifyBatchReminders(propertyLeads, "Follow-up", "property");
      await PropertyLead.updateMany(
        { _id: { $in: propertyLeads.map((l) => l._id) } },
        { $set: { reminderSent: true } }
      );
    }

    if (notes.length) {
      console.log(`  ✅ Notifying ${notes.length} task notes`);
      await Promise.all(
        notes.map(async (note) => {
          await notifyTaskDue(note, note.createdBy);
          await TaskNote.updateOne({ _id: note._id }, { $set: { reminderSent: true } });
        })
      );
    }
  } catch (err) {
    console.error("[reminderJob] error:", err);
  } finally {
    isRunning = false;
  }
}

// Start cron when DB is ready (app.js loads this after connectDB)
if (mongoose.connection.readyState === 1) {
  cron.schedule(CRON_SCHEDULE, runReminderJob);
  console.log("✅ Reminder cron scheduled (every second)");
} else {
  mongoose.connection.once("connected", () => {
    cron.schedule(CRON_SCHEDULE, runReminderJob);
    console.log("✅ Reminder cron scheduled (every second)");
  });
}

module.exports = { runReminderJob };
