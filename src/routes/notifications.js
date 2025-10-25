const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notificationsController");
const { authenticate } = require("../middleware/auth");

// Register push token (requires authentication)
router.post("/register", authenticate, notificationsController.registerPushToken);

module.exports = router;
