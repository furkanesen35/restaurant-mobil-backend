const express = require("express");
const router = express.Router();
const consentController = require("../controllers/consentController");
const { authenticate } = require("../middleware/auth");

// Get user's current consent settings
router.get("/", authenticate, consentController.getConsent);

// Update consent preferences
router.put("/", authenticate, consentController.updateConsent);

// Get privacy policy text
router.get("/privacy-policy", consentController.getPrivacyPolicy);

module.exports = router;
