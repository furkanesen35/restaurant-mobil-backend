const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notificationsController");
const { authenticate, requireAdmin } = require("../middleware/auth");

// Register push token (requires authentication)
router.post("/register", authenticate, notificationsController.registerPushToken);

// Get notification history for current user
router.get("/history", authenticate, notificationsController.getNotificationHistory);

// Mark notification as opened
router.patch("/:notificationId/opened", authenticate, notificationsController.markNotificationOpened);

// NEW: Admin send custom message
router.post(
  "/send-admin-message",
  authenticate,
  requireAdmin,
  notificationsController.sendAdminMessage
);

// NEW: Get message templates (predefined messages)
router.get(
  "/templates",
  authenticate,
  requireAdmin,
  notificationsController.getMessageTemplates
);

module.exports = router;
