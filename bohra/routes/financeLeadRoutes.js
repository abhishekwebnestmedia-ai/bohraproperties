const express = require("express");
const router = express.Router();

const { requireSignIn, allowRoles } = require("../middleware/authmiddleware");
const { upload } = require("../middleware/upload");

const financeLeadController = require("../controllers/financeLeadController");
const FinanceExportController = require("../controllers/financeExportController");

// ✅ bulk upload first
router.post("/bulk-upload", requireSignIn, upload.single("file"), financeLeadController.bulkUploadLeads);
router.delete("/bulk-delete", requireSignIn, financeLeadController.bulkDeleteLeads);

// Export finance leads as JSON file (admin only)
router.get(
	"/export",
	requireSignIn,
	FinanceExportController.exportFinanceLeads
);

// ✅ bulk transfer (important: must be before /:id)
router.patch("/bulk-transfer", requireSignIn, financeLeadController.bulkTransferLeads);

router.get("/fdashboard", requireSignIn, financeLeadController.getFinanceDashboard);
// CRUD
router.post("/", requireSignIn, financeLeadController.createLead);
router.get("/", requireSignIn, financeLeadController.getLeads);

// ✅ Specific routes MUST come before /:id routes
router.get("/:id/history", requireSignIn, financeLeadController.getLeadHistory);
router.patch("/:id/stage", requireSignIn, financeLeadController.updateStage);
router.patch("/:id/status", requireSignIn, financeLeadController.updateStatus);
router.patch("/:id/transfer", requireSignIn, financeLeadController.transferLead);
router.patch("/:id/followup", requireSignIn, financeLeadController.updateFollowUp);

// ✅ Generic routes come last
router.get("/:id", requireSignIn, financeLeadController.getLeadById);
router.put("/:id", requireSignIn, financeLeadController.updateLead);
router.delete("/:id", requireSignIn, financeLeadController.deleteLead);

module.exports = router;
