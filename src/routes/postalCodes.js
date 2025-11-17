const express = require("express");
const router = express.Router();
const postalCodeController = require("../controllers/postalCodeController");
const { authenticate, requireAdmin } = require("../middleware/auth");

// Public endpoint used by checkout/address forms
router.get("/", postalCodeController.getActivePostalCodes);

// Admin endpoints for CRUD
router.get("/admin", authenticate, requireAdmin, postalCodeController.getAllPostalCodes);
router.post("/", authenticate, requireAdmin, postalCodeController.createPostalCode);
router.put("/:id", authenticate, requireAdmin, postalCodeController.updatePostalCode);
router.delete("/:id", authenticate, requireAdmin, postalCodeController.deletePostalCode);

module.exports = router;
