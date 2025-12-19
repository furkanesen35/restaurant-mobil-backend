const { PrismaClient } = require("../generated/prisma");
const logger = require("../utils/logger");

const prisma = new PrismaClient();

const cartInclude = {
  menuItem: true,
  modifiers: {
    include: {
      modifier: true,
    },
  },
};

const formatCartItems = (items = []) => {
  const formatted = items.map((item) => ({
    cartItemId: item.id,
    menuItemId: item.menuItemId.toString(),
    quantity: item.quantity,
    specialInstructions: item.specialInstructions || null,
    name: item.menuItem?.name || "",
    nameEn: item.menuItem?.nameEn || null,
    nameDe: item.menuItem?.nameDe || null,
    description: item.menuItem?.description || "",
    descriptionEn: item.menuItem?.descriptionEn || null,
    descriptionDe: item.menuItem?.descriptionDe || null,
    price: item.menuItem?.price || 0,
    imageUrl: item.imageUrl || item.menuItem?.imageUrl || null,
    categoryId: item.menuItem?.categoryId?.toString() || null,
    modifiers: (item.modifiers || []).map((mod) => ({
      modifierId: mod.modifierId,
      quantity: mod.quantity,
      name: mod.modifier?.name || "",
      nameEn: mod.modifier?.nameEn || null,
      nameDe: mod.modifier?.nameDe || null,
      price: mod.modifier?.price || 0,
      type: mod.modifier?.type || "addition",
    })),
  }));
  logger.info("formatCartItems output:", JSON.stringify(formatted, null, 2));
  return formatted;
};

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
    const { menuItemId, quantity = 1, modifiers = [], specialInstructions } = req.body || {};

    logger.info("addItem request body:", JSON.stringify(req.body, null, 2));

    const parsedMenuItemId = parseInt(menuItemId, 10);
    const parsedQuantity = Math.max(1, parseInt(quantity, 10) || 1);

    if (!parsedMenuItemId) {
      return res.status(400).json({ error: "menuItemId is required" });
    }

    // Validate special instructions length
    if (specialInstructions && specialInstructions.length > 200) {
      return res.status(400).json({
        error: "Special instructions must be 200 characters or less",
      });
    }

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: parsedMenuItemId },
    });

    if (!menuItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    // Validate modifiers if provided
    const parsedModifiers = [];
    logger.info("Raw modifiers type:", typeof modifiers, "isArray:", Array.isArray(modifiers), "value:", JSON.stringify(modifiers));
    
    // Convert object to array if needed (in case body-parser converted it)
    let modifiersArray = modifiers;
    if (modifiers && typeof modifiers === 'object' && !Array.isArray(modifiers)) {
      modifiersArray = Object.values(modifiers);
      logger.info("Converted modifiers object to array:", JSON.stringify(modifiersArray));
    }
    
    if (modifiersArray && Array.isArray(modifiersArray) && modifiersArray.length > 0) {
      logger.info("Processing modifiers:", JSON.stringify(modifiersArray));
      const modifierIds = modifiersArray.map((m) => parseInt(m.modifierId, 10)).filter((id) => !isNaN(id));
      logger.info("Parsed modifier IDs:", modifierIds, "for menuItemId:", parsedMenuItemId);
      
      if (modifierIds.length > 0) {
        const existingModifiers = await prisma.menuItemModifier.findMany({
          where: {
            id: { in: modifierIds },
            menuItemId: parsedMenuItemId,
            isAvailable: true,
          },
        });
        logger.info("Found existing modifiers:", existingModifiers.length, JSON.stringify(existingModifiers));

        for (const mod of modifiersArray) {
          const modifierId = parseInt(mod.modifierId, 10);
          const modQuantity = Math.max(1, parseInt(mod.quantity, 10) || 1);
          const existingMod = existingModifiers.find((m) => m.id === modifierId);

          if (!existingMod) {
            logger.warn(`Modifier ${modifierId} not found for menuItem ${parsedMenuItemId}`);
            return res.status(400).json({
              error: `Modifier ${modifierId} is not valid for this menu item`,
            });
          }

          // Validate type constraints
          if ((existingMod.type === "removal" || existingMod.type === "preparation") && modQuantity !== 1) {
            return res.status(400).json({
              error: `${existingMod.type} modifiers can only have quantity of 1`,
            });
          }

          if (modQuantity > existingMod.maxQuantity) {
            return res.status(400).json({
              error: `Modifier "${existingMod.name}" can only be added up to ${existingMod.maxQuantity} times`,
            });
          }

          parsedModifiers.push({
            modifierId,
            quantity: modQuantity,
          });
        }
        logger.info("Final parsedModifiers:", JSON.stringify(parsedModifiers));
      }
    }

    // Check if a cart item with the same menu item and modifiers already exists
    const existingCartItems = await prisma.cartItem.findMany({
      where: {
        userId,
        menuItemId: parsedMenuItemId,
      },
      include: {
        modifiers: true,
      },
    });

    // Find a cart item with matching modifiers AND special instructions
    const modifiersKey = JSON.stringify(
      parsedModifiers.sort((a, b) => a.modifierId - b.modifierId)
    );
    
    const matchingCartItem = existingCartItems.find((cartItem) => {
      const existingModifiersKey = JSON.stringify(
        cartItem.modifiers
          .map((m) => ({ modifierId: m.modifierId, quantity: m.quantity }))
          .sort((a, b) => a.modifierId - b.modifierId)
      );
      // Also match special instructions
      const instructionsMatch = (cartItem.specialInstructions || "") === (specialInstructions || "");
      return existingModifiersKey === modifiersKey && instructionsMatch;
    });

    if (matchingCartItem) {
      // Update quantity of existing cart item
      await prisma.cartItem.update({
        where: { id: matchingCartItem.id },
        data: {
          quantity: {
            increment: parsedQuantity,
          },
        },
      });
    } else {
      // Create new cart item with modifiers and special instructions
      await prisma.cartItem.create({
        data: {
          userId,
          menuItemId: parsedMenuItemId,
          quantity: parsedQuantity,
          specialInstructions: specialInstructions || null,
          imageUrl: menuItem.imageUrl,
          modifiers: {
            create: parsedModifiers,
          },
        },
      });
    }

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
    const cartItemId = parseInt(req.params.menuItemId, 10); // This now represents cartItemId for items with modifiers
    const { quantity } = req.body || {};
    const parsedQuantity = parseInt(quantity, 10);

    if (!cartItemId) {
      return res.status(400).json({ error: "cartItemId is required" });
    }

    if (Number.isNaN(parsedQuantity)) {
      return res.status(400).json({ error: "quantity must be a number" });
    }

    // Find the cart item and verify ownership
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        userId,
      },
    });

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    if (parsedQuantity <= 0) {
      await prisma.cartItem.delete({
        where: { id: cartItemId },
      });
    } else {
      await prisma.cartItem.update({
        where: { id: cartItemId },
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
    const cartItemId = parseInt(req.params.menuItemId, 10); // This now represents cartItemId

    if (!cartItemId) {
      return res.status(400).json({ error: "cartItemId is required" });
    }

    // Find the cart item and verify ownership
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        userId,
      },
    });

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
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
