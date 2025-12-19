const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

// Get all ingredients (with optional category filter)
const getAllIngredients = async (req, res) => {
  try {
    const { category, available } = req.query;

    const where = {};
    if (category) {
      where.category = category;
    }
    if (available !== undefined) {
      where.isAvailable = available === "true";
    }

    const ingredients = await prisma.ingredient.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    res.json({ ingredients });
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    res.status(500).json({ error: "Failed to fetch ingredients" });
  }
};

// Get ingredients grouped by category
const getIngredientsByCategory = async (req, res) => {
  try {
    const ingredients = await prisma.ingredient.findMany({
      where: { isAvailable: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Group by category
    const grouped = ingredients.reduce((acc, ing) => {
      if (!acc[ing.category]) {
        acc[ing.category] = [];
      }
      acc[ing.category].push(ing);
      return acc;
    }, {});

    res.json({ grouped, ingredients });
  } catch (error) {
    console.error("Error fetching ingredients by category:", error);
    res.status(500).json({ error: "Failed to fetch ingredients" });
  }
};

// Get single ingredient
const getIngredient = async (req, res) => {
  try {
    const { id } = req.params;

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: parseInt(id) },
    });

    if (!ingredient) {
      return res.status(404).json({ error: "Ingredient not found" });
    }

    res.json({ ingredient });
  } catch (error) {
    console.error("Error fetching ingredient:", error);
    res.status(500).json({ error: "Failed to fetch ingredient" });
  }
};

// Create ingredient (admin only)
const createIngredient = async (req, res) => {
  try {
    const { name, nameEn, nameDe, category, pricePerUnit, isAvailable } =
      req.body;

    // Validation
    if (!name || !category) {
      return res
        .status(400)
        .json({ error: "Name and category are required" });
    }

    const validCategories = [
      "protein",
      "vegetable",
      "sauce",
      "bread",
      "cheese",
      "extras",
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
      });
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        nameEn,
        nameDe,
        category,
        pricePerUnit: parseFloat(pricePerUnit) || 0,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
      },
    });

    res.status(201).json({ ingredient });
  } catch (error) {
    console.error("Error creating ingredient:", error);
    res.status(500).json({ error: "Failed to create ingredient" });
  }
};

// Update ingredient (admin only)
const updateIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nameEn, nameDe, category, pricePerUnit, isAvailable } =
      req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (nameEn !== undefined) updateData.nameEn = nameEn;
    if (nameDe !== undefined) updateData.nameDe = nameDe;
    if (category !== undefined) {
      const validCategories = [
        "protein",
        "vegetable",
        "sauce",
        "bread",
        "cheese",
        "extras",
      ];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          error: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        });
      }
      updateData.category = category;
    }
    if (pricePerUnit !== undefined)
      updateData.pricePerUnit = parseFloat(pricePerUnit);
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    const ingredient = await prisma.ingredient.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({ ingredient });
  } catch (error) {
    console.error("Error updating ingredient:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Ingredient not found" });
    }
    res.status(500).json({ error: "Failed to update ingredient" });
  }
};

// Delete ingredient (admin only)
const deleteIngredient = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ingredient is used in any menu items
    const usage = await prisma.menuItemIngredient.findFirst({
      where: { ingredientId: parseInt(id) },
    });

    if (usage) {
      return res.status(400).json({
        error:
          "Cannot delete ingredient that is used in menu items. Remove from menu items first or set isAvailable to false.",
      });
    }

    await prisma.ingredient.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Ingredient deleted successfully" });
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Ingredient not found" });
    }
    res.status(500).json({ error: "Failed to delete ingredient" });
  }
};

module.exports = {
  getAllIngredients,
  getIngredientsByCategory,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
};
