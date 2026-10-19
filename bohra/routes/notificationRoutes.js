const router = require("express").Router();

const ctrl = require("../controllers/notificationController");
const { requireSignIn } = require("../middleware/authmiddleware");


router.get("/", requireSignIn, ctrl.getMyNotifications);

router.patch("/:id/read", requireSignIn, ctrl.markRead);

router.patch("/read-all", requireSignIn, ctrl.markAllRead);

router.delete("/:id", requireSignIn, ctrl.deleteNotification);

module.exports = router;
