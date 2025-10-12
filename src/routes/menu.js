const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");
const { menuValidation } = require("../middleware/validation");
const { authenticate, requireAdmin } = require("../middleware/auth");

// Get all menu categories and items (public)
router.get("/", menuController.getMenu);

// Get all categories (public)
router.get("/categories", menuController.getCategories);

// Get a single menu item by id (public)
router.get("/item/:id", menuValidation.getItem, menuController.getMenuItem);

// Admin routes for category management
router.post(
  "/categories",
  authenticate,
  requireAdmin,
  menuController.createCategory
);
router.put(
  "/categories/:id",
  authenticate,
  requireAdmin,
  menuController.updateCategory
);
router.delete(
  "/categories/:id",
  authenticate,
  requireAdmin,
  menuController.deleteCategory
);

// Admin routes for menu item management
router.post("/", authenticate, requireAdmin, menuController.createMenuItem);
router.put("/:id", authenticate, requireAdmin, menuController.updateMenuItem);
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  menuController.deleteMenuItem
);

// Seed menu data (for development only)
router.post("/seed", menuController.seedMenu);

module.exports = router;
