const mongoose = require("mongoose");

const IST_OFFSET_MINUTES = 330;

function istFormat(date) {
  if (!date) return date;
  const dt = new Date(date);
  const istTime = new Date(dt.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return istTime.toISOString().replace("Z", "+05:30");
}

// ✅ recursively convert Date fields inside objects
function convertNestedDatesToIST(obj) {
  if (!obj || typeof obj !== "object") return obj;

  if (obj instanceof Date) return istFormat(obj);

  if (Array.isArray(obj)) {
    return obj.map(convertNestedDatesToIST);
  }

  const out = {};
  for (const k of Object.keys(obj)) {
    out[k] = convertNestedDatesToIST(obj[k]);
  }
  return out;
}

const propertyLeadHistorySchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PropertyLead",
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: [
        "CREATED",
        "UPDATED",
        "STATUS_CHANGED",
        "TRANSFERRED",
        "FOLLOWUP_CHANGED",
        "BULK_UPLOADED",
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
        ["createdAt", "updatedAt"].forEach((k) => {
          if (ret[k]) ret[k] = istFormat(ret[k]);
        });

        // ✅ convert nested dates too
        ret.previous = convertNestedDatesToIST(ret.previous);
        ret.current = convertNestedDatesToIST(ret.current);

        return ret;
      },
    },

    toObject: {
      virtuals: true,
      transform(doc, ret) {
        ["createdAt", "updatedAt"].forEach((k) => {
          if (ret[k]) ret[k] = istFormat(ret[k]);
        });

        ret.previous = convertNestedDatesToIST(ret.previous);
        ret.current = convertNestedDatesToIST(ret.current);

        return ret;
      },
    },
  }
);

propertyLeadHistorySchema.index({ leadId: 1, createdAt: -1 });
propertyLeadHistorySchema.index({ performedBy: 1, createdAt: -1 });
propertyLeadHistorySchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("PropertyLeadHistory", propertyLeadHistorySchema);
