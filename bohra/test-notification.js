/**
 * Test script to verify notification timing
 * Creates a task note with dueDate 5 seconds in future
 * Checks if notification arrives at scheduled time
 */

const mongoose = require("mongoose");
const User = require("./models/user");
const TaskNote = require("./models/taskNote");
const Notification = require("./models/notification");
const env = require("./env");

async function testNotificationTiming() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get first user
    const user = await User.findOne().select("_id name");
    if (!user) {
      console.error("❌ No users found in database");
      process.exit(1);
    }
    console.log(`📦 Using user: ${user.name} (${user._id})\n`);

    // Calculate dueDate: 5 seconds from now
    const now = new Date();
    const dueDate = new Date(now.getTime() + 5000);
    
    console.log(`⏰ Current time: ${now.toISOString()}`);
    console.log(`📅 Task dueDate: ${dueDate.toISOString()}`);
    console.log(`⏳ Notification should arrive in 5 seconds\n`);

    // Step 1: Check notifications BEFORE creating task
    let notifsBefore = await Notification.countDocuments({ user: user._id });
    console.log(`Before: ${notifsBefore} notifications for this user`);

    // Step 2: Create task note
    console.log("\n📝 Creating task note...");
    const taskNote = await TaskNote.create({
      title: "Test Task - Notification Timing",
      note: "Testing notification at scheduled time",
      dueDate: dueDate,
      status: "Pending",
      priority: "High",
      createdBy: user._id,
      reminderSent: false,
    });
    console.log(`✅ Task created: ${taskNote._id}`);
    console.log(`   - reminderSent: ${taskNote.reminderSent}`);

    // Step 3: Check notifications IMMEDIATELY after creating task (should still be 0)
    let notifsAfterCreate = await Notification.countDocuments({ user: user._id });
    console.log(`\nImmediately after create: ${notifsAfterCreate} notifications`);
    if (notifsAfterCreate === notifsBefore) {
      console.log("✅ PASS: No immediate notification sent!");
    } else {
      console.log("❌ FAIL: Notification sent immediately!");
    }

    // Step 4: Wait for scheduled time + 2 seconds
    console.log("\n⏳ Waiting 7 seconds for cron job to trigger...");
    await new Promise((resolve) => setTimeout(resolve, 7000));

    // Step 5: Check notifications AFTER scheduled time (should now have 1)
    let notifsAfterTime = await Notification.countDocuments({ user: user._id });
    console.log(`\nAfter scheduled time: ${notifsAfterTime} notifications`);
    
    if (notifsAfterTime > notifsAfterCreate) {
      console.log("✅ PASS: Notification arrived at scheduled time!");
      const notif = await Notification.findOne({ user: user._id }).sort({ createdAt: -1 });
      console.log(`\n📬 Notification Details:`);
      console.log(`   - Title: ${notif.title}`);
      console.log(`   - Message: ${notif.message}`);
      console.log(`   - Type: ${notif.type}`);
      console.log(`   - Created: ${notif.createdAt.toISOString()}`);
    } else {
      console.log("⚠️  No notification arrived at scheduled time");
    }

    // Step 6: Check if reminderSent was updated
    const updatedTask = await TaskNote.findById(taskNote._id);
    console.log(`\n🔄 Task reminderSent status: ${updatedTask.reminderSent}`);
    if (updatedTask.reminderSent) {
      console.log("✅ PASS: reminderSent was set to true");
    } else {
      console.log("⚠️  reminderSent is still false");
    }

    console.log("\n✅ Test Complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

testNotificationTiming();
