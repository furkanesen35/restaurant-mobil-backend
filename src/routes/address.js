const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");
const { authenticate } = require("../middleware/auth");

router.post("/", authenticate, addressController.createAddress);
router.get("/", authenticate, addressController.getAddresses);
router.put("/:id", authenticate, addressController.updateAddress);
router.delete("/:id", authenticate, addressController.deleteAddress);

module.exports = router;
