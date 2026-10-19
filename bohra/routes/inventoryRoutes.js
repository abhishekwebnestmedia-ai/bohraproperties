const express = require("express");
const  router = express.Router();

const { requireSignIn, allowRoles } = require("../middleware/authmiddleware");
const InventoryController = require("../controllers/inventoryController");
const InventoryExportController = require("../controllers/inventoryExportController");

/* =====================================================
   INVENTORY ROUTES
===================================================== */

/* ---------- CREATE INVENTORY ---------- */
router.post(
  "/",
  requireSignIn,
  InventoryController.createInventory
);

/* ---------- BULK UPLOAD INVENTORY ---------- */
/* expects multipart/form-data with file */
router.post(
  "/bulk-upload",
  requireSignIn,
  InventoryController.bulkUploadInventory
);

/* ---------- BULK DELETE INVENTORY ---------- */
router.delete(
  "/bulk-delete",
  requireSignIn,
  InventoryController.bulkDeleteInventory
);

// Export inventory as JSON file (admin only)
router.get(
  "/export",
  requireSignIn,
  InventoryExportController.exportInventories
);

/* ---------- GET ALL INVENTORIES ---------- */
router.get(
  "/",
  requireSignIn,
  InventoryController.getInventories
);

/* ---------- GET SINGLE INVENTORY ---------- */
router.get(
  "/:id",
  requireSignIn,
  InventoryController.getInventoryById
);

/* ---------- UPDATE INVENTORY (FULL / PARTIAL) ---------- */
router.put(
  "/:id",
  requireSignIn,
  InventoryController.updateInventory
);

router.patch(
  "/:id",
  requireSignIn,
  InventoryController.updateInventory
);

/* ---------- DELETE INVENTORY ---------- */
router.delete(
  "/:id",
  requireSignIn,
  InventoryController.deleteInventory
);

module.exports = router;
