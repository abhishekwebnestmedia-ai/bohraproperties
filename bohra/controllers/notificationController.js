const Notification = require("../models/notification");

/* ==============================
   GET NOTIFICATIONS
============================== */
exports.getMyNotifications = async (req, res) => {
  try {
    const { userId } = req.user;

    // Every user only sees their own notifications (admins too)
    const filter = { user: userId };

    const list = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("user", "name email");

    res.json({
      success: true,
      data: list,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

/* ==============================
   MARK READ
============================== */
exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    // Admins can mark any notification read; others only their own
    const filter = { _id: id };
    if (role !== "admin" && role !== "superadmin") {
      filter.user = userId;
    }

    await Notification.findOneAndUpdate(filter, { isRead: true });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

/* ==============================
   MARK ALL READ
============================== */
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.userId },
      { isRead: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

/* ==============================
   DELETE
============================== */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    await Notification.findOneAndDelete({
      _id: id,
      user: req.user.userId,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};
