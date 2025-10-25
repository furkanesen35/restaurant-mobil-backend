const express = require("express");
const router = express.Router();
const favoritesController = require("../controllers/favoritesController");
const { authenticate } = require("../middleware/auth");

// All favorites routes require authentication
router.use(authenticate);

// Get user's favorites
router.get("/", favoritesController.getFavorites);

// Add to favorites
router.post("/", favoritesController.addFavorite);

// Remove from favorites
router.delete("/:menuItemId", favoritesController.removeFavorite);

// Check if item is favorited
router.get("/check/:menuItemId", favoritesController.checkFavorite);

module.exports = router;
