const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

// Get ingredients for a menu item
const getMenuItemIngredients = async (req, res) => {
  try {
    const { menuItemId } = req.params;

    const ingredients = await prisma.menuItemIngredient.findMany({
      where: { menuItemId: parseInt(menuItemId) },
      include: {
        ingredient: true,
      },
      orderBy: { ingredient: { category: "asc" } },
    });

    // Format response
    const formatted = ingredients.map((mi) => ({
      id: mi.id,
      ingredientId: mi.ingredient.id,
      name: mi.ingredient.name,
      nameEn: mi.ingredient.nameEn,
      nameDe: mi.ingredient.nameDe,
      category: mi.ingredient.category,
      pricePerUnit: mi.ingredient.pricePerUnit,
      defaultQuantity: mi.defaultQuantity,
      isAvailable: mi.ingredient.isAvailable,
    }));

    res.json({ ingredients: formatted });
  } catch (error) {
    console.error("Error fetching menu item ingredients:", error);
    res.status(500).json({ error: "Failed to fetch ingredients" });
  }
};

// Add ingredient to menu item (admin only)
const addIngredientToMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const { ingredientId, defaultQuantity } = req.body;

    if (!ingredientId || !defaultQuantity) {
      return res
        .status(400)
        .json({ error: "ingredientId and defaultQuantity are required" });
    }

    // Check if ingredient already exists for this menu item
    const existing = await prisma.menuItemIngredient.findUnique({
      where: {
        menuItemId_ingredientId: {
          menuItemId: parseInt(menuItemId),
          ingredientId: parseInt(ingredientId),
        },
      },
    });

    if (existing) {
      return res
        .status(400)
        .json({ error: "Ingredient already added to this menu item" });
    }

    const menuItemIngredient = await prisma.menuItemIngredient.create({
      data: {
        menuItemId: parseInt(menuItemId),
        ingredientId: parseInt(ingredientId),
        defaultQuantity: parseInt(defaultQuantity),
      },
      include: {
        ingredient: true,
      },
    });

    res.status(201).json({ menuItemIngredient });
  } catch (error) {
    console.error("Error adding ingredient to menu item:", error);
    res.status(500).json({ error: "Failed to add ingredient" });
  }
};

// Update ingredient quantity in menu item (admin only)
const updateMenuItemIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const { defaultQuantity } = req.body;

    if (!defaultQuantity) {
      return res.status(400).json({ error: "defaultQuantity is required" });
    }

    const menuItemIngredient = await prisma.menuItemIngredient.update({
      where: { id: parseInt(id) },
      data: { defaultQuantity: parseInt(defaultQuantity) },
      include: {
        ingredient: true,
      },
    });

    res.json({ menuItemIngredient });
  } catch (error) {
    console.error("Error updating menu item ingredient:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Menu item ingredient not found" });
    }
    res.status(500).json({ error: "Failed to update ingredient" });
  }
};

// Remove ingredient from menu item (admin only)
const removeIngredientFromMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.menuItemIngredient.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Ingredient removed from menu item successfully" });
  } catch (error) {
    console.error("Error removing ingredient from menu item:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Menu item ingredient not found" });
    }
    res.status(500).json({ error: "Failed to remove ingredient" });
  }
};

// Bulk set ingredients for a menu item (admin only)
const setMenuItemIngredients = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const { ingredients } = req.body; // Array of {ingredientId, defaultQuantity}

    if (!Array.isArray(ingredients)) {
      return res
        .status(400)
        .json({ error: "ingredients must be an array" });
    }

    // Delete existing ingredients
    await prisma.menuItemIngredient.deleteMany({
      where: { menuItemId: parseInt(menuItemId) },
    });

    // Create new ones
    const created = await prisma.menuItemIngredient.createMany({
      data: ingredients.map((ing) => ({
        menuItemId: parseInt(menuItemId),
        ingredientId: parseInt(ing.ingredientId),
        defaultQuantity: parseInt(ing.defaultQuantity),
      })),
    });

    // Fetch with details
    const result = await prisma.menuItemIngredient.findMany({
      where: { menuItemId: parseInt(menuItemId) },
      include: {
        ingredient: true,
      },
    });

    res.json({ ingredients: result, count: created.count });
  } catch (error) {
    console.error("Error setting menu item ingredients:", error);
    res.status(500).json({ error: "Failed to set ingredients" });
  }
};

module.exports = {
  getMenuItemIngredients,
  addIngredientToMenuItem,
  updateMenuItemIngredient,
  removeIngredientFromMenuItem,
  setMenuItemIngredients,
};
