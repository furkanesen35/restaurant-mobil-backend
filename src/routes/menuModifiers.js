const express = require("express");
const router = express.Router();
const modifierController = require("../controllers/menuModifierController");
const { authenticate, requireAdmin } = require("../middleware/auth");

// Public: Get modifiers for a specific menu item
router.get("/menu-item/:menuItemId", modifierController.getModifiersForItem);

// Admin: Get all modifiers
router.get("/", authenticate, requireAdmin, modifierController.getAllModifiers);

// Admin: Create a new modifier
router.post("/", authenticate, requireAdmin, modifierController.createModifier);

// Admin: Bulk create modifiers for a menu item
router.post("/bulk", authenticate, requireAdmin, modifierController.bulkCreateModifiers);

// Admin: Update a modifier
router.put("/:id", authenticate, requireAdmin, modifierController.updateModifier);

// Admin: Delete a modifier
router.delete("/:id", authenticate, requireAdmin, modifierController.deleteModifier);

module.exports = router;
