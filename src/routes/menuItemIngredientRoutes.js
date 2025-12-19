const express = require("express");
const router = express.Router();
const {
  getMenuItemIngredients,
  addIngredientToMenuItem,
  updateMenuItemIngredient,
  removeIngredientFromMenuItem,
  setMenuItemIngredients,
} = require("../controllers/menuItemIngredientController");
const { authenticate, requireAdmin } = require("../middleware/auth");

// Public routes - get ingredients for a menu item
router.get("/menu-item/:menuItemId", getMenuItemIngredients);

// Admin routes - manage ingredients
router.post(
  "/menu-item/:menuItemId",
  authenticate,
  requireAdmin,
  addIngredientToMenuItem
);

router.put(
  "/:id",
  authenticate,
  requireAdmin,
  updateMenuItemIngredient
);

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  removeIngredientFromMenuItem
);

// Bulk set all ingredients for a menu item
router.post(
  "/menu-item/:menuItemId/bulk",
  authenticate,
  requireAdmin,
  setMenuItemIngredients
);

module.exports = router;
