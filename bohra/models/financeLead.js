const mongoose = require("mongoose");

const FINANCE_LEAD_STATUSES = [
  "Dead",
  "Follow up",
  "Interested",
  "Busy",
  "Closed",
];

const FINANCE_LEAD_STAGES = ["Lead", "Login"];

// ✅ IST formatter
const istFormat = (date) => {
  if (!date) return date;
  const dt = new Date(date);
  const istTime = new Date(dt.getTime() + 330 * 60 * 1000);
  return istTime.toISOString().replace("Z", "+05:30");
};

const financeLeadSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true, trim: true, index: true },
    contactNumber: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, index: true },
reminderSent: {
  type: Boolean,
  default: false,
},

    loanRequirement: { type: String, trim: true, index: true },

    location: { type: String, trim: true, index: true },
    Eligibility: { type: String, trim: true, index: true },
    source: { type: String, trim: true, index: true },

    stage: {
      type: String,
      enum: { values: FINANCE_LEAD_STAGES, message: "Invalid finance lead stage" },
      default: "Lead",
      required: true,
      index: true,
    },

    followUpDate: { type: Date, default: null, index: true },

    status: {
  type: String,
  enum: {
    values: FINANCE_LEAD_STATUSES,
    message: "Invalid finance lead status",
  },
  default: null,   // ✅ default is null
  required: false, // ✅ not required
  index: true,
},


    notes: { type: String, trim: true },
    remarks: { type: String, trim: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    teamLead: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, default: null },
    relationshipManager: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, default: null },

    transferDate: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    toJSON: {
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

// ✅ Indexes
financeLeadSchema.index({ createdAt: -1 });
financeLeadSchema.index({ stage: 1, createdAt: -1 });
financeLeadSchema.index({ status: 1, createdAt: -1 });
financeLeadSchema.index({ createdBy: 1, createdAt: -1 });
financeLeadSchema.index({ teamLead: 1, createdAt: -1 });

// ✅ Search Index
financeLeadSchema.index({
  clientName: "text",
  contactNumber: "text",
  email: "text",
  location: "text",
  Eligibility: "text",
  loanRequirement: "text",
});

module.exports = mongoose.model("FinanceLead", financeLeadSchema);
module.exports.FINANCE_LEAD_STATUSES = FINANCE_LEAD_STATUSES;
module.exports.FINANCE_LEAD_STAGES = FINANCE_LEAD_STAGES;



