const express = require("express");
const router = express.Router();
const {
  getAllIngredients,
  getIngredientsByCategory,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} = require("../controllers/ingredientController");
const { authenticate, requireAdmin } = require("../middleware/auth");

// Public routes
router.get("/", getAllIngredients);
router.get("/grouped", getIngredientsByCategory);
router.get("/:id", getIngredient);

// Admin routes
router.post("/", authenticate, requireAdmin, createIngredient);
router.put("/:id", authenticate, requireAdmin, updateIngredient);
router.delete("/:id", authenticate, requireAdmin, deleteIngredient);

module.exports = router;
