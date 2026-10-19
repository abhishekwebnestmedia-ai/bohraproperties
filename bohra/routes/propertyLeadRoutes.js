const express = require("express");
const router = express.Router();

const { requireSignIn, allowRoles } = require("../middleware/authmiddleware");
const { upload } = require("../middleware/upload");

const PropertyController = require("../controllers/propertyLeadController");
const PropertyExportController = require("../controllers/propertyExportController");

// ✅ IMPORTANT: bulk-upload should come before "/:id"
router.post("/bulk-upload", requireSignIn, upload.single("file"), PropertyController.bulkUploadLeads);
router.delete("/bulk-delete", requireSignIn, PropertyController.bulkDeleteLeads);
router.get(
  "/export",
  requireSignIn,
  PropertyExportController.exportPropertyLeads
);
router.get(
  "/pdashboard",
  requireSignIn,
 // ✅ ONLY ADMIN ACCESS
  PropertyController.getPropertyDashboard
);
router.patch(
  "/bulk-transfer",
  requireSignIn,
  PropertyController.bulkTransferLeads
);

router.post("/", requireSignIn, PropertyController.createLead);
router.get("/", requireSignIn, PropertyController.getLeads);

// ✅ IMPORTANT: Specific routes MUST come before /:id routes
router.get("/:id/history", requireSignIn, PropertyController.getLeadHistory);
router.patch("/:id/stage",    requireSignIn, PropertyController.updateStage);
router.patch("/:id/status",   requireSignIn, PropertyController.updateStatus);
router.patch("/:id/transfer", requireSignIn, PropertyController.transferLead);
router.patch("/:id/followup", requireSignIn, PropertyController.updateFollowUp);

// ✅ Generic routes come last
router.get("/:id", requireSignIn, PropertyController.getLeadById);
router.put("/:id", requireSignIn, PropertyController.updateLead);
router.delete("/:id", requireSignIn, PropertyController.deleteLead);



module.exports = router;
