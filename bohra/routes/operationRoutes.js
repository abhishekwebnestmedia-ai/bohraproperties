const express = require("express");
const router = express.Router();

const operationsController = require("../controllers/operationsController");
const { requireSignIn } = require("../middleware/authmiddleware");

// Admin check inside controller

router.post(
  "/spending",
  requireSignIn,
  operationsController.createSpending
);

router.get(
  "/spending",
  requireSignIn,
  operationsController.getSpendings
);

router.put(
  "/spending/:id",
  requireSignIn,
  operationsController.updateSpending
);

router.delete(
  "/spending/:id",
  requireSignIn,
  operationsController.deleteSpending
);

router.get(
  "/dashboard",
  requireSignIn,
  operationsController.getOperationsDashboard
);
router.get(
  "/spending-stats",
  requireSignIn,
  operationsController.getSpendingTypeStats
);

router.get(
  "/lead-source-chart",
  requireSignIn,
  operationsController.getLeadSourceChart
);

module.exports = router;



