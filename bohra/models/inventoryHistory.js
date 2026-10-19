const mongoose = require("mongoose");

/* =====================================================
   INVENTORY HISTORY SCHEMA
   Track all changes to inventory items
===================================================== */

const inventoryHistorySchema = new mongoose.Schema(
  {
    // Reference to the inventory item
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
      index: true,
    },

    // Action type: CREATED, UPDATED, DELETED, STATUS_CHANGED, etc.
    action: {
      type: String,
      enum: [
        "CREATED",
        "UPDATED",
        "DELETED",
        "STATUS_CHANGED",
        "BULK_UPLOADED",
      ],
      required: true,
      index: true,
    },

    // User who performed the action
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Previous state (before change)
    previous: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Current state (after change)
    current: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Human-readable message
    message: {
      type: String,
      default: "",
    },

    // IP address of requester
    ip: {
      type: String,
      default: "",
    },

    // User agent of requester
    userAgent: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    collection: "inventoryHistories",
  }
);

// Indexes for efficient queries
inventoryHistorySchema.index({ inventoryId: 1, createdAt: -1 });
inventoryHistorySchema.index({ performedBy: 1, createdAt: -1 });
inventoryHistorySchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("InventoryHistory", inventoryHistorySchema);
