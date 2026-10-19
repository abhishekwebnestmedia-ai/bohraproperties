const mongoose = require("mongoose");

// ✅ IST formatter
const istFormat = (date) => {
  if (!date) return date;
  const dt = new Date(date);
  const istTime = new Date(dt.getTime() + 330 * 60 * 1000);
  return istTime.toISOString().replace("Z", "+05:30");
};

// ✅ Deep convert dates in nested objects
const convertDatesInObject = (value) => {
  if (!value) return value;

  if (value instanceof Date) return istFormat(value);

  if (Array.isArray(value)) return value.map(convertDatesInObject);

  if (typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value)) {
      const v = value[key];

      if (v instanceof Date) out[key] = istFormat(v);
      else if (typeof v === "string" && !isNaN(Date.parse(v))) out[key] = istFormat(new Date(v));
      else out[key] = convertDatesInObject(v);
    }
    return out;
  }

  return value;
};

const financeLeadHistorySchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinanceLead",
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: [
        "CREATED",
        "UPDATED",
        "STATUS_CHANGED",
        "STAGE_CHANGED",
        "TRANSFERRED",
        "FOLLOWUP_CHANGED",
        "BULK_UPLOADED",
        "BULK_TRANSFERRED",
        "DELETED",
      ],
      required: true,
      index: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    previous: { type: Object, default: {} },
    current: { type: Object, default: {} },

    message: { type: String, trim: true },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        if (ret.createdAt) ret.createdAt = istFormat(ret.createdAt);
        if (ret.updatedAt) ret.updatedAt = istFormat(ret.updatedAt);

        if (ret.previous) ret.previous = convertDatesInObject(ret.previous);
        if (ret.current) ret.current = convertDatesInObject(ret.current);

        return ret;
      },
    },
  }
);

financeLeadHistorySchema.index({ leadId: 1, createdAt: -1 });

module.exports = mongoose.model("FinanceLeadHistory", financeLeadHistorySchema);
