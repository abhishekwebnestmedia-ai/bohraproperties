const mongoose = require("mongoose");

// ✅ IST helper
const IST_OFFSET_MINUTES = 330;

function istFormat(date) {
  if (!date) return date;
  const dt = new Date(date);
  const istTime = new Date(dt.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return istTime.toISOString().replace("Z", "+05:30");
}

/**
 * ✅ Parse date/time input as IST-aware Date
 * Supported:
 * 1) "YYYY-MM-DD" -> IST midnight
 * 2) "YYYY-MM-DD HH:mm" -> IST datetime
 * 3) "YYYY-MM-DDTHH:mm:ss+05:30" (or Z) -> exact datetime
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

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split("-").map(Number);
    const utcMidnight = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    return new Date(utcMidnight.getTime() - IST_OFFSET_MINUTES * 60 * 1000);
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

// ✅ enums
const NOTE_PRIORITY = ["Low", "Medium", "High"];
const NOTE_STATUS = ["Pending", "In Progress", "Completed", "Cancelled"];

// ✅ comment schema
const commentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    commentedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { _id: true }
);

const taskNoteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    note: { type: String, trim: true, default: "" },
reminderSent: {
  type: Boolean,
  default: false,
},

    dueDate: { type: Date, default: null, index: true },

    status: {
      type: String,
      enum: NOTE_STATUS,
      default: "Pending",
      required: true,
      index: true,
    },

    priority: {
      type: String,
      enum: NOTE_PRIORITY,
      default: "Low",
      required: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ✅ multiple comments array
    comments: { type: [commentSchema], default: [] },

    // ✅ TTL deletion
    deleteAt: { type: Date, default: null },
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ["createdAt", "updatedAt", "dueDate", "deleteAt"].forEach((k) => {
          if (ret[k]) ret[k] = istFormat(ret[k]);
        });

        // ✅ comments createdAt in IST
        if (Array.isArray(ret.comments)) {
          ret.comments = ret.comments.map((c) => ({
            ...c,
            createdAt: c.createdAt ? istFormat(c.createdAt) : c.createdAt,
          }));
        }

        return ret;
      },
    },

    toObject: {
      virtuals: true,
      transform(doc, ret) {
        ["createdAt", "updatedAt", "dueDate", "deleteAt"].forEach((k) => {
          if (ret[k]) ret[k] = istFormat(ret[k]);
        });

        if (Array.isArray(ret.comments)) {
          ret.comments = ret.comments.map((c) => ({
            ...c,
            createdAt: c.createdAt ? istFormat(c.createdAt) : c.createdAt,
          }));
        }

        return ret;
      },
    },
  }
);

// ✅ TTL Index
taskNoteSchema.index({ deleteAt: 1 }, { expireAfterSeconds: 0 });

// ✅ main indexes
taskNoteSchema.index({ createdBy: 1, createdAt: -1 });
taskNoteSchema.index({ createdBy: 1, status: 1, createdAt: -1 });
taskNoteSchema.index({ createdBy: 1, dueDate: 1 });
taskNoteSchema.index({ title: "text", note: "text" });

// ✅ deleteAt calculator
function calculateDeleteAt(dueDate) {
  if (!dueDate) return null;
  return new Date(new Date(dueDate).getTime() + 90 * 24 * 60 * 60 * 1000);
}

taskNoteSchema.pre("save", function (next) {
  this.deleteAt = calculateDeleteAt(this.dueDate);
  next();
});

taskNoteSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (!update) return next();

  const target = update.$set || update;

  if (target.dueDate !== undefined) {
    target.deleteAt = calculateDeleteAt(target.dueDate);
  }

  next();
});

module.exports = mongoose.model("TaskNote", taskNoteSchema);
module.exports.NOTE_PRIORITY = NOTE_PRIORITY;
module.exports.NOTE_STATUS = NOTE_STATUS;
module.exports.parseISTDateTime = parseISTDateTime;
