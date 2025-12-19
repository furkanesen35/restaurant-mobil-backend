const { PrismaClient } = require("../generated/prisma");
const logger = require("../utils/logger");
const prisma = new PrismaClient();

// Get all modifiers for a specific menu item
exports.getModifiersForItem = async (req, res) => {
  try {
    const menuItemId = parseInt(req.params.menuItemId);
    
    if (!menuItemId || isNaN(menuItemId)) {
      return res.status(400).json({ error: "Valid menuItemId is required" });
    }

    // Check if menu item exists
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!menuItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const modifiers = await prisma.menuItemModifier.findMany({
      where: {
        menuItemId,
        isAvailable: true,
      },
      orderBy: [
        { type: "asc" },       // Group by type first
        { category: "asc" },
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });

    // Group modifiers by type for easier frontend rendering
    const grouped = {
      additions: modifiers.filter((m) => m.type === "addition"),
      removals: modifiers.filter((m) => m.type === "removal"),
      preparations: modifiers.filter((m) => m.type === "preparation"),
    };

    res.json({ modifiers, grouped });
  } catch (err) {
    logger.error("Error fetching modifiers for menu item:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Get all modifiers (admin)
exports.getAllModifiers = async (req, res) => {
  try {
    const modifiers = await prisma.menuItemModifier.findMany({
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            nameDe: true,
          },
        },
      },
      orderBy: [
        { menuItemId: "asc" },
        { category: "asc" },
        { sortOrder: "asc" },
      ],
    });

    res.json({ modifiers });
  } catch (err) {
    logger.error("Error fetching all modifiers:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Create a new modifier (admin)
exports.createModifier = async (req, res) => {
  try {
    const {
      menuItemId,
      name,
      nameEn,
      nameDe,
      price,
      type,
      category,
      isAvailable,
      sortOrder,
      maxQuantity,
    } = req.body;

    // Validate required fields
    if (!menuItemId || !name || price === undefined) {
      return res.status(400).json({
        error: "menuItemId, name, and price are required",
      });
    }

    const parsedMenuItemId = parseInt(menuItemId);
    const parsedPrice = parseFloat(price);

    if (isNaN(parsedMenuItemId)) {
      return res.status(400).json({ error: "Invalid menuItemId" });
    }

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: "Invalid price" });
    }

    // Validate type
    const validTypes = ["addition", "removal", "preparation"];
    const modifierType = type || "addition";
    if (!validTypes.includes(modifierType)) {
      return res.status(400).json({
        error: "Invalid type. Must be: addition, removal, or preparation",
      });
    }

    // Validate price constraints by type
    if ((modifierType === "removal" || modifierType === "preparation") && parsedPrice !== 0) {
      return res.status(400).json({
        error: `${modifierType} modifiers must have price = 0`,
      });
    }

    // Check if menu item exists
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: parsedMenuItemId },
    });

    if (!menuItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const modifier = await prisma.menuItemModifier.create({
      data: {
        menuItemId: parsedMenuItemId,
        name,
        nameEn: nameEn || null,
        nameDe: nameDe || null,
        price: parsedPrice,
        type: modifierType,
        category: category || null,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
        maxQuantity: maxQuantity !== undefined ? parseInt(maxQuantity) : 5,
      },
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info(`Created ${modifierType} modifier ${modifier.id} for menu item ${parsedMenuItemId}`);
    res.status(201).json({ modifier });
  } catch (err) {
    logger.error("Error creating modifier:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Update a modifier (admin)
exports.updateModifier = async (req, res) => {
  try {
    const modifierId = parseInt(req.params.id);
    
    if (!modifierId || isNaN(modifierId)) {
      return res.status(400).json({ error: "Valid modifier ID is required" });
    }

    const existingModifier = await prisma.menuItemModifier.findUnique({
      where: { id: modifierId },
    });

    if (!existingModifier) {
      return res.status(404).json({ error: "Modifier not found" });
    }

    const {
      name,
      nameEn,
      nameDe,
      price,
      type,
      category,
      isAvailable,
      sortOrder,
      maxQuantity,
    } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (nameEn !== undefined) updateData.nameEn = nameEn;
    if (nameDe !== undefined) updateData.nameDe = nameDe;
    
    // Validate and update type
    if (type !== undefined) {
      const validTypes = ["addition", "removal", "preparation"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: "Invalid type. Must be: addition, removal, or preparation",
        });
      }
      updateData.type = type;
    }
    
    if (price !== undefined) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ error: "Invalid price" });
      }
      
      // Validate price constraints by type
      const modifierType = type || existingModifier.type;
      if ((modifierType === "removal" || modifierType === "preparation") && parsedPrice !== 0) {
        return res.status(400).json({
          error: `${modifierType} modifiers must have price = 0`,
        });
      }
      
      updateData.price = parsedPrice;
    }
    
    if (category !== undefined) updateData.category = category;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder);
    if (maxQuantity !== undefined) updateData.maxQuantity = parseInt(maxQuantity);

    const modifier = await prisma.menuItemModifier.update({
      where: { id: modifierId },
      data: updateData,
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info(`Updated modifier ${modifierId}`);
    res.json({ modifier });
  } catch (err) {
    logger.error("Error updating modifier:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Delete a modifier (admin)
exports.deleteModifier = async (req, res) => {
  try {
    const modifierId = parseInt(req.params.id);
    
    if (!modifierId || isNaN(modifierId)) {
      return res.status(400).json({ error: "Valid modifier ID is required" });
    }

    const existingModifier = await prisma.menuItemModifier.findUnique({
      where: { id: modifierId },
    });

    if (!existingModifier) {
      return res.status(404).json({ error: "Modifier not found" });
    }

    await prisma.menuItemModifier.delete({
      where: { id: modifierId },
    });

    logger.info(`Deleted modifier ${modifierId}`);
    res.json({ success: true, message: "Modifier deleted successfully" });
  } catch (err) {
    logger.error("Error deleting modifier:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Bulk create modifiers for a menu item (admin)
exports.bulkCreateModifiers = async (req, res) => {
  try {
    const { menuItemId, modifiers } = req.body;

    if (!menuItemId || !modifiers || !Array.isArray(modifiers)) {
      return res.status(400).json({
        error: "menuItemId and modifiers array are required",
      });
    }

    const parsedMenuItemId = parseInt(menuItemId);

    // Check if menu item exists
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: parsedMenuItemId },
    });

    if (!menuItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const createdModifiers = await prisma.$transaction(
      modifiers.map((mod, index) =>
        prisma.menuItemModifier.create({
          data: {
            menuItemId: parsedMenuItemId,
            name: mod.name,
            nameEn: mod.nameEn || null,
            nameDe: mod.nameDe || null,
            price: parseFloat(mod.price) || 0,
            category: mod.category || null,
            isAvailable: mod.isAvailable !== undefined ? mod.isAvailable : true,
            sortOrder: mod.sortOrder !== undefined ? parseInt(mod.sortOrder) : index,
            maxQuantity: mod.maxQuantity !== undefined ? parseInt(mod.maxQuantity) : 5,
          },
        })
      )
    );

    logger.info(`Bulk created ${createdModifiers.length} modifiers for menu item ${parsedMenuItemId}`);
    res.status(201).json({ modifiers: createdModifiers });
  } catch (err) {
    logger.error("Error bulk creating modifiers:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
