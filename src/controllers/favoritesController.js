const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

// Get user's favorites
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        menuItem: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedFavorites = favorites.map((fav) => ({
      id: fav.id,
      menuItem: {
        id: fav.menuItem.id.toString(),
        name: fav.menuItem.name,
        description: fav.menuItem.description || "",
        price: fav.menuItem.price,
        category: fav.menuItem.categoryId.toString(),
        imageUrl: fav.menuItem.imageUrl,
        isVegetarian: fav.menuItem.isVegetarian,
        isVegan: fav.menuItem.isVegan,
        isGlutenFree: fav.menuItem.isGlutenFree,
        isSpicy: fav.menuItem.isSpicy,
        allergens: fav.menuItem.allergens,
      },
      createdAt: fav.createdAt,
    }));

    res.json(formattedFavorites);
  } catch (err) {
    console.error("Get favorites error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Add item to favorites
exports.addFavorite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { menuItemId } = req.body;

    if (!menuItemId) {
      return res.status(400).json({ error: "menuItemId is required" });
    }

    const menuItemIdInt = parseInt(menuItemId);

    // Check if menu item exists
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemIdInt },
    });

    if (!menuItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_menuItemId: {
          userId,
          menuItemId: menuItemIdInt,
        },
      },
    });

    if (existing) {
      return res.status(200).json({
        message: "Already in favorites",
        favorite: existing,
      });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        menuItemId: menuItemIdInt,
      },
      include: {
        menuItem: true,
      },
    });

    res.status(201).json({
      message: "Added to favorites",
      favorite,
    });
  } catch (err) {
    console.error("Add favorite error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Remove item from favorites
exports.removeFavorite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const menuItemId = parseInt(req.params.menuItemId);

    if (!menuItemId) {
      return res.status(400).json({ error: "menuItemId is required" });
    }

    await prisma.favorite.delete({
      where: {
        userId_menuItemId: {
          userId,
          menuItemId,
        },
      },
    });

    res.json({ message: "Removed from favorites" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Favorite not found" });
    }
    console.error("Remove favorite error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Check if item is favorited
exports.checkFavorite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const menuItemId = parseInt(req.params.menuItemId);

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_menuItemId: {
          userId,
          menuItemId,
        },
      },
    });

    res.json({ isFavorite: !!favorite });
  } catch (err) {
    console.error("Check favorite error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
