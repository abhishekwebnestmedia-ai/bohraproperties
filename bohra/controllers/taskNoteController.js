const mongoose = require("mongoose");
const TaskNote = require("../models/taskNote");
const { parseISTDateTime } = require("../models/taskNote");



const NOTE_ALLOWED_FIELDS = ["title", "note", "dueDate", "status", "priority", "comments"];

const NOTE_ALLOWED_STATUSES = ["Pending", "In Progress", "Completed", "Cancelled"];

/** Normalise free-text status values so the frontend can send any casing */
const normalizeStatus = (status) => {
  if (status === undefined || status === null) return status;
  const v = String(status).trim().toLowerCase();
  if (v === "pending") return "Pending";
  if (v === "in progress" || v === "in_progress" || v === "inprogress") return "In Progress";
  if (v === "completed") return "Completed";
  if (v === "cancelled" || v === "canceled") return "Cancelled";
  return null;
};

const pick = (obj, keys) => {
  const out = {};
  keys.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  });
  return out;
};

// =====================================================
// ✅ CREATE NOTE
// =====================================================
exports.createNote = async (req, res) => {
  try {
    const { userId } = req.user;

    const payload = pick(req.body, NOTE_ALLOWED_FIELDS);

    if (!payload.title || !String(payload.title).trim()) {
      return res.status(400).json({ success: false, message: "title is required" });
    }

    payload.title = String(payload.title).trim();
    payload.note = payload.note ? String(payload.note).trim() : "";

    // ✅ dueDate parse
    if (payload.dueDate) {
      const parsed = parseISTDateTime(payload.dueDate);
      if (!parsed) {
        return res.status(400).json({
          success: false,
          message: "Invalid dueDate format (YYYY-MM-DD or ISO with +05:30)",
        });
      }
      payload.dueDate = parsed;
    }

    // ✅ comments support on create (optional)
    let comments = [];
    if (payload.comments !== undefined) {
      if (!Array.isArray(payload.comments)) {
        return res.status(400).json({
          success: false,
          message: "comments must be an array",
        });
      }

      comments = payload.comments
        .map((c) => {
          if (typeof c === "string") return { text: c.trim() };
          if (c && typeof c === "object" && c.text) return { text: String(c.text).trim() };
          return null;
        })
        .filter(Boolean)
        .map((c) => ({ ...c, commentedBy: userId }));
    }

    // ✅ normalise + validate status
    if (payload.status !== undefined) {
      const normalised = normalizeStatus(payload.status);
      if (!normalised) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Allowed: Pending, In Progress, Completed, Cancelled",
        });
      }
      payload.status = normalised;
    }

    const noteDoc = await TaskNote.create({
      title: payload.title,
      note: payload.note,
      dueDate: payload.dueDate || null,
      status: payload.status || "Pending",
      priority: payload.priority || "Low",
      createdBy: userId,
      comments,
    });

    const populated = await TaskNote.findById(noteDoc._id).populate([
      { path: "createdBy", select: "name email role employeeId" },
      { path: "comments.commentedBy", select: "name email role employeeId" },
    ]);

    return res.status(201).json({
      success: true,
      message: "Note created successfully",
      data: populated,
    });
  } catch (err) {
    console.error("createNote error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================================================
// ✅ GET NOTES (USER SPECIFIC)
// =====================================================
exports.getNotes = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, search } = req.query;
    const { userId, role } = req.user;

    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.max(parseInt(limit), 1);
    const skip = (pageNum - 1) * limitNum;

    let filter = {};

    // ✅ superadmin sees ALL notes
    if (role !== "superadmin") {
      filter.createdBy = new mongoose.Types.ObjectId(userId);
    }

    if (status && status !== "All") filter.status = status;
    if (priority && priority !== "All") filter.priority = priority;

    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const [total, notes] = await Promise.all([
      TaskNote.countDocuments(filter),
      TaskNote.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate([
          { path: "createdBy", select: "name email role employeeId" },
          { path: "comments.commentedBy", select: "name email role employeeId" },
        ]),
    ]);

    return res.status(200).json({
      success: true,
      message: "Notes fetched successfully",
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      data: notes,
    });
  } catch (err) {
    console.error("getNotes error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



// =====================================================
// ✅ GET NOTE BY ID
// =====================================================
exports.getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    const filter = { _id: id };

    // ✅ only restrict if NOT superadmin
    if (role !== "superadmin") {
      filter.createdBy = userId;
    }

    const note = await TaskNote.findOne(filter).populate([
      { path: "createdBy", select: "name email role employeeId" },
      { path: "comments.commentedBy", select: "name email role employeeId" },
    ]);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: note,
    });
  } catch (err) {
    console.error("getNoteById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


// =====================================================
// ✅ UPDATE NOTE (ONLY ONE API)
// - update all fields
// - add comments array (APPEND)
// PUT /api/notes/:id
// =====================================================

exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const old = await TaskNote.findOne({ _id: id, createdBy: userId });
    if (!old) {
      return res.status(404).json({
        success: false,
        message: "Note not found"
      });
    }

    const updates = pick(req.body, NOTE_ALLOWED_FIELDS);

    // ✅ title
    if (updates.title !== undefined) {
      if (!updates.title || !String(updates.title).trim()) {
        return res.status(400).json({
          success: false,
          message: "title cannot be empty"
        });
      }

      updates.title = String(updates.title).trim();
    }

    // ✅ note
    if (updates.note !== undefined) {
      updates.note = updates.note ? String(updates.note).trim() : "";
    }

    // ✅ status
    if (updates.status !== undefined) {
      const normalised = normalizeStatus(updates.status);
      if (!normalised) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Allowed: Pending, In Progress, Completed, Cancelled"
        });
      }
      updates.status = normalised;
    }

    // ✅ priority
    if (updates.priority !== undefined) {
      const allowedPriority = ["Low", "Medium", "High"];

      if (!allowedPriority.includes(updates.priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid priority. Allowed: Low, Medium, High"
        });
      }
    }

    // ✅ dueDate IST (with reminder reset)
    if (updates.dueDate !== undefined) {
      if (!updates.dueDate) {
        // cleared
        updates.dueDate = null;

        // ✅ reset reminder
        updates.reminderSent = false;

      } else {
        const parsed = parseISTDateTime(updates.dueDate);

        if (!parsed) {
          return res.status(400).json({
            success: false,
            message: "Invalid dueDate format (YYYY-MM-DD or ISO with +05:30)"
          });
        }

        updates.dueDate = parsed;

        // ✅ reset reminder
        updates.reminderSent = false;
      }
    }

    // ✅ comments (array) -> APPEND
    let commentDocs = [];

    if (updates.comments !== undefined) {
      if (!Array.isArray(updates.comments)) {
        return res.status(400).json({
          success: false,
          message: "comments must be an array"
        });
      }

      commentDocs = updates.comments
        .map((c) => {
          if (typeof c === "string") return { text: c.trim() };

          if (c && typeof c === "object" && c.text) {
            return { text: String(c.text).trim() };
          }

          return null;
        })
        .filter(Boolean)
        .map((c) => ({
          ...c,
          commentedBy: userId,
          createdAt: new Date(),
        }));

      delete updates.comments; // remove from $set
    }

    // ✅ build update query
    const updateQuery = { $set: updates };

    if (commentDocs.length) {
      updateQuery.$push = {
        comments: { $each: commentDocs }
      };
    }

    const updated = await TaskNote.findOneAndUpdate(
      { _id: id, createdBy: userId },
      updateQuery,
      { new: true, runValidators: true }
    ).populate([
      { path: "createdBy", select: "name email role employeeId" },
      { path: "comments.commentedBy", select: "name email role employeeId" },
    ]);

    // Task due reminders are handled by cron job at the scheduled time
    // Reset reminderSent so cron picks it up at the right time
    if (updates.dueDate && (!old.dueDate || old.dueDate.getTime() !== updated.dueDate.getTime())) {
      await TaskNote.updateOne({ _id: id }, { $set: { reminderSent: false } });
    }

    return res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data: updated,
    });

  } catch (err) {
    console.error("updateNote error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// =====================================================
// ✅ DELETE NOTE
// =====================================================
exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await TaskNote.findOneAndDelete({
      _id: id,
      createdBy: req.user.userId,
    });

    if (!deleted) return res.status(404).json({ success: false, message: "Note not found" });

    return res.status(200).json({ success: true, message: "Note deleted successfully" });
  } catch (err) {
    console.error("deleteNote error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
