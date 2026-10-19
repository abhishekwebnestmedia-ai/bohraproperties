const mongoose = require("mongoose");
const env = require("../env");

// Import models
const PropertyLead = require("../models/propertyLead");
const FinanceLead = require("../models/financeLead");
const TaskNote = require("../models/taskNote");

async function run() {
  try {
    console.log("🔄 Connecting to MongoDB...");

    await mongoose.connect(env.MONGO_URI);

    console.log("✅ Connected");

    /* ================= PROPERTY ================= */

    const pRes = await PropertyLead.updateMany(
      { reminderSent: { $exists: false } },
      { $set: { reminderSent: false } }
    );

    console.log("Property updated:", pRes.modifiedCount);

    /* ================= FINANCE ================= */

    const fRes = await FinanceLead.updateMany(
      { reminderSent: { $exists: false } },
      { $set: { reminderSent: false } }
    );

    console.log("Finance updated:", fRes.modifiedCount);

    /* ================= NOTES ================= */

    const nRes = await TaskNote.updateMany(
      { reminderSent: { $exists: false } },
      { $set: { reminderSent: false } }
    );

    console.log("Notes updated:", nRes.modifiedCount);

    console.log("🎉 Migration Completed");

    process.exit(0);
  } catch (err) {
    console.error("❌ Migration Failed:", err);
    process.exit(1);
  }
}

run();
