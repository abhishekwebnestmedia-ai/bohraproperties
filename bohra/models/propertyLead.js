const mongoose = require("mongoose");

/**
 * Stage   = the lifecycle position of the lead (Lead → Token → Completed).
 *           This drives the three top-level tabs in the UI.
 * Status  = the current activity/follow-up status within any stage.
 *           Freely editable by authorised users at any point.
 */

const PROPERTY_LEAD_STAGES = ["Lead", "Token", "Completed", "Dead"];

const PROPERTY_LEAD_STATUSES = [
  "Follow up",
  "Interested",
  "Busy",
  "Dead",
];

const propertyTypee = ["Commercial", "Residential"];
// ✅ IST helper (single source of truth)
const IST_OFFSET_MINUTES = 330;

function istFormat(date) {
  if (!date) return date;
  const dt = new Date(date);
  const istTime = new Date(dt.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return istTime.toISOString().replace("Z", "+05:30");
}

const propertyLeadSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true, trim: true, index: true },
    contactNumber: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, index: true },
reminderSent: {
  type: Boolean,
  default: false,
},

    budget: { type: String, trim: true, index: true },
    location: { type: String, trim: true, index: true },
    project: { type: String, trim: true, index: true },
    source: { type: String, trim: true, index: true },

    followUpDate: { type: Date, default: null, index: true },

    /**
     * Stage  — lifecycle progression (Lead → Token → Completed).
     * Read-only via normal edits; changed through the dedicated
     * PATCH /pleads/:id/stage endpoint with strict one-way validation.
     */
    stage: {
      type: String,
      enum: { values: PROPERTY_LEAD_STAGES, message: "Invalid lead stage" },
      default: "Lead",
      required: true,
      index: true,
    },

    /**
     * Status  — activity / follow-up state within the current stage.
     * Can be null (no activity recorded yet) and freely changed by
     * authorised users regardless of stage.
     */
    status: {
      type: String,
      enum: {
        values: PROPERTY_LEAD_STATUSES,
        message: "Invalid property lead status",
      },
      default: null,
      required: false,
      index: true,
    },

        propertyType: { type: String, trim: true, enum: propertyTypee, index: true },

    notes: { type: String, trim: true },
    remarks: { type: String, trim: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    teamLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },

    relationshipManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },

    transferDate: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,

    // ✅ Apply IST on both JSON + Object
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ["createdAt", "updatedAt", "followUpDate", "transferDate"].forEach((k) => {
          if (ret[k]) ret[k] = istFormat(ret[k]);
        });
        return ret;
      },
    },

    toObject: {
      virtuals: true,
      transform(doc, ret) {
        ["createdAt", "updatedAt", "followUpDate", "transferDate"].forEach((k) => {
          if (ret[k]) ret[k] = istFormat(ret[k]);
        });
        return ret;
      },
    },
  }
);

// Indexes
propertyLeadSchema.index({ createdAt: -1 });
propertyLeadSchema.index({ stage: 1, createdAt: -1 });
propertyLeadSchema.index({ stage: 1, status: 1, createdAt: -1 });
propertyLeadSchema.index({ createdBy: 1, createdAt: -1 });
propertyLeadSchema.index({ teamLead: 1, createdAt: -1 });

// Search
propertyLeadSchema.index({
  clientName: "text",
  contactNumber: "text",
  email: "text",
  location: "text",
  project: "text",
});

module.exports = mongoose.model("PropertyLead", propertyLeadSchema);
module.exports.PROPERTY_LEAD_STATUSES = PROPERTY_LEAD_STATUSES;
module.exports.PROPERTY_LEAD_STAGES   = PROPERTY_LEAD_STAGES;
