const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authenticate } = require("../middleware/auth");

router.post("/", authenticate, paymentController.createPaymentMethod);
router.get("/", authenticate, paymentController.getPaymentMethods);
router.put("/:id", authenticate, paymentController.updatePaymentMethod);
router.delete("/:id", authenticate, paymentController.deletePaymentMethod);

module.exports = router;
