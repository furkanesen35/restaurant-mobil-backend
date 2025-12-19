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
const { authenticate } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/roleAuth");

// Public routes
router.get("/", getAllIngredients);
router.get("/grouped", getIngredientsByCategory);
router.get("/:id", getIngredient);

// Admin routes
router.post("/", authenticate, authorizeRoles("admin"), createIngredient);
router.put("/:id", authenticate, authorizeRoles("admin"), updateIngredient);
router.delete("/:id", authenticate, authorizeRoles("admin"), deleteIngredient);

module.exports = router;
