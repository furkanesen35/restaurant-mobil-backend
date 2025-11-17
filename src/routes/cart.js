const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/", cartController.getCart);
router.post("/", cartController.addItem);
router.patch("/:menuItemId", cartController.updateItem);
router.delete("/:menuItemId", cartController.removeItem);
router.delete("/", cartController.clearCart);

module.exports = router;
