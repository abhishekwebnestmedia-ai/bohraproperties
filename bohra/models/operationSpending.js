const mongoose = require("mongoose");

const IST_OFFSET_MINUTES = 330;

function istFormat(date) {
  if (!date) return date;

  const dt = new Date(date);
  const ist = new Date(dt.getTime() + IST_OFFSET_MINUTES * 60 * 1000);

  return ist.toISOString().replace("Z", "+05:30");
}

const OPERATION_TYPES = [
  "Meta",
  "WhatsApp",
  "Google",
  "Referral",
  "99Acres",
  "Walk in",
  "Other",
];

const operationSpendingSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: OPERATION_TYPES,
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },

    note: {
      type: String,
      trim: true,
    },

    // Admin / SuperAdmin
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ["createdAt", "updatedAt"].forEach((k) => {
          if (ret[k]) ret[k] = istFormat(ret[k]);
        });
        return ret;
      },
    },

    toObject: {
      virtuals: true,
      transform(doc, ret) {
        ["createdAt", "updatedAt"].forEach((k) => {
          if (ret[k]) ret[k] = istFormat(ret[k]);
        });
        return ret;
      },
    },
  }
);

operationSpendingSchema.index({ type: 1, createdAt: -1 });
operationSpendingSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model(
  "OperationSpending",
  operationSpendingSchema
);
