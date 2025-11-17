const { PrismaClient } = require("../generated/prisma");
const logger = require("../utils/logger");

const prisma = new PrismaClient();

const cartInclude = {
  menuItem: true,
};

const formatCartItems = (items = []) =>
  items.map((item) => ({
    menuItemId: item.menuItemId.toString(),
    quantity: item.quantity,
    name: item.menuItem?.name || "",
    nameEn: item.menuItem?.nameEn || null,
    nameDe: item.menuItem?.nameDe || null,
    description: item.menuItem?.description || "",
    descriptionEn: item.menuItem?.descriptionEn || null,
    descriptionDe: item.menuItem?.descriptionDe || null,
    price: item.menuItem?.price || 0,
    imageUrl: item.imageUrl || item.menuItem?.imageUrl || null,
    categoryId: item.menuItem?.categoryId?.toString() || null,
  }));

const fetchUserCart = async (userId) => {
  return prisma.cartItem.findMany({
    where: { userId },
    include: cartInclude,
    orderBy: { updatedAt: "desc" },
  });
};

exports.getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const items = await fetchUserCart(userId);
    res.json({ items: formatCartItems(items) });
  } catch (err) {
    logger.error("Failed to fetch cart", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

exports.addItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { menuItemId, quantity = 1 } = req.body || {};

    const parsedMenuItemId = parseInt(menuItemId, 10);
    const parsedQuantity = Math.max(1, parseInt(quantity, 10) || 1);

    if (!parsedMenuItemId) {
      return res.status(400).json({ error: "menuItemId is required" });
    }

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: parsedMenuItemId },
    });

    if (!menuItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    await prisma.cartItem.upsert({
      where: {
        userId_menuItemId: {
          userId,
          menuItemId: parsedMenuItemId,
        },
      },
      update: {
        quantity: {
          increment: parsedQuantity,
        },
        imageUrl: menuItem.imageUrl,
      },
      create: {
        userId,
        menuItemId: parsedMenuItemId,
        quantity: parsedQuantity,
        imageUrl: menuItem.imageUrl,
      },
    });

    const items = await fetchUserCart(userId);
    res.status(201).json({ items: formatCartItems(items) });
  } catch (err) {
    logger.error("Failed to add cart item", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const menuItemId = parseInt(req.params.menuItemId, 10);
    const { quantity } = req.body || {};
    const parsedQuantity = parseInt(quantity, 10);

    if (!menuItemId) {
      return res.status(400).json({ error: "menuItemId is required" });
    }

    if (Number.isNaN(parsedQuantity)) {
      return res.status(400).json({ error: "quantity must be a number" });
    }

    if (parsedQuantity <= 0) {
      await prisma.cartItem.delete({
        where: {
          userId_menuItemId: {
            userId,
            menuItemId,
          },
        },
      });
    } else {
      await prisma.cartItem.update({
        where: {
          userId_menuItemId: {
            userId,
            menuItemId,
          },
        },
        data: {
          quantity: parsedQuantity,
        },
      });
    }

    const items = await fetchUserCart(userId);
    res.json({ items: formatCartItems(items) });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Cart item not found" });
    }
    logger.error("Failed to update cart item", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const menuItemId = parseInt(req.params.menuItemId, 10);

    if (!menuItemId) {
      return res.status(400).json({ error: "menuItemId is required" });
    }

    await prisma.cartItem.delete({
      where: {
        userId_menuItemId: {
          userId,
          menuItemId,
        },
      },
    });

    const items = await fetchUserCart(userId);
    res.json({ items: formatCartItems(items) });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Cart item not found" });
    }
    logger.error("Failed to remove cart item", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    await prisma.cartItem.deleteMany({ where: { userId } });
    res.json({ items: [] });
  } catch (err) {
    logger.error("Failed to clear cart", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
