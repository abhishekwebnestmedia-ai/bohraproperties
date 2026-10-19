const express = require("express");
const router = express.Router();
const mongoupload = require("../middleware/mongoupload");
const memberUpload = require("../middleware/memberUpload");

const authController = require("../controllers/authController");
const setupController = require("../controllers/setupController");
const { requireSignIn, allowRoles } = require("../middleware/authmiddleware");

/* =========================================================
   PUBLIC ROUTES (No Auth Required)
   ========================================================= */
router.post("/login", authController.login);
// One-time protected endpoint to create a superadmin. Protect using ONE_TIME_ADMIN_SECRET env var.
router.post("/create-superadmin", setupController.createSuperadmin);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Email approval link (no auth header available)
router.get("/approve-user/:token", authController.approveUser);

/* =========================================================
   PROTECTED ROUTES (Auth Required)
   ========================================================= */
router.post("/logout", requireSignIn, authController.logout);

/* =========================================================
   USER MANAGEMENT (ADMIN / SUPERADMIN)
   ========================================================= */

// Register user (admin & superadmin)
router.post(
  "/register",
  requireSignIn,
  allowRoles("superadmin", "admin"),
  memberUpload,          // handles multipart: profileImage + documents
  authController.register
);

// Get all users (authenticated users)
router.get(
  "/users",
  requireSignIn,
  authController.getAllUsers
);

// Change role (superadmin only)
router.put(
  "/change-role/:userId",
  requireSignIn,
  allowRoles("superadmin"),
  authController.changeUserRole
);

// Delete user (admin & superadmin)
router.delete(
  "/delete-user/:userId",
  requireSignIn,
  allowRoles("admin", "superadmin"),
  authController.deleteUser
);

// Approve / Disapprove user (admin & superadmin)
router.put(
  "/approve-user/:userId",
  requireSignIn,
  allowRoles("admin", "superadmin"),
  authController.approveOrDisapproveUser
);

// Update user details (self or admin/superadmin)
router.put(
  "/update-user/:userId",
  requireSignIn,
  mongoupload.single("profileImage"),
  authController.updateUserByAdmin
);

/* =========================================================
   USER-SPECIFIC DATA
   ========================================================= */

// Get own profile
router.get("/me", requireSignIn, authController.getMe);

// User dashboard
router.get(
  "/users/:userId/dashboard",
  requireSignIn,
  authController.getUserDashboardInfo
);

// User leads
router.get(
  "/users/:userId/leads",
  requireSignIn,
  authController.getUserLeads
);

module.exports = router;