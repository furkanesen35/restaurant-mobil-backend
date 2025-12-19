const express = require("express");
const router = express.Router();
const {
  getMenuItemIngredients,
  addIngredientToMenuItem,
  updateMenuItemIngredient,
  removeIngredientFromMenuItem,
  setMenuItemIngredients,
} = require("../controllers/menuItemIngredientController");
const { authenticate } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/roleAuth");

// Public routes - get ingredients for a menu item
router.get("/menu-item/:menuItemId", getMenuItemIngredients);

// Admin routes - manage ingredients
router.post(
  "/menu-item/:menuItemId",
  authenticate,
  authorizeRoles("admin"),
  addIngredientToMenuItem
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  updateMenuItemIngredient
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  removeIngredientFromMenuItem
);

// Bulk set all ingredients for a menu item
router.post(
  "/menu-item/:menuItemId/bulk",
  authenticate,
  authorizeRoles("admin"),
  setMenuItemIngredients
);

module.exports = router;
