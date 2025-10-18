// Delete order (admin only)
exports.deleteOrder = async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    console.log("[DELETE] Attempting to delete order:", orderId);
    if (!orderId) {
      console.log("[DELETE] No orderId provided");
      return res.status(400).json({ error: "orderId required" });
    }
    // Cascade delete will handle related OrderItems automatically
    await prisma.order.delete({ where: { id: orderId } });
    console.log("[DELETE] Order deleted (cascade):", orderId);
    res.json({ success: true });
  } catch (err) {
    console.error("[DELETE] Error deleting order:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

// Create a new order
exports.createOrder = async (req, res, next) => {
  try {
    const { validationResult } = require("express-validator");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    console.log("Full request body:", JSON.stringify(req.body, null, 2));
    console.log("Raw request body type:", typeof req.body);
    console.log(
      "Raw items type:",
      typeof req.body.items,
      "isArray:",
      Array.isArray(req.body.items),
    );

    const { userId: bodyUserId, items, addressId } = req.body;
    // Use userId from JWT token if available, otherwise from body
    const userId = req.user ? req.user.userId : parseInt(bodyUserId);

    console.log(
      "Extracted userId:",
      userId,
      "bodyUserId:",
      bodyUserId,
      "items:",
      items,
      "addressId:",
      addressId,
    );

    // Convert object to array if needed (temporary fix for serialization issue)
    let processedItems;
    if (Array.isArray(items)) {
      processedItems = items;
    } else if (typeof items === "object" && items !== null) {
      // Convert object with numeric keys to array
      processedItems = Object.values(items);
      console.log("Converted object to array:", processedItems);
    } else {
      processedItems = [];
    }

    if (!userId || !processedItems || processedItems.length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "User ID and items are required",
      });
    }

    // Convert string IDs to integers and validate
    const finalItems = processedItems.map((item) => ({
      menuItemId: parseInt(item.menuItemId),
      quantity: parseInt(item.quantity) || 1,
    }));

    // Validate that all menu items exist
    const menuItemIds = finalItems.map((item) => item.menuItemId);
    const existingItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    if (existingItems.length !== menuItemIds.length) {
      const missingIds = menuItemIds.filter(
        (id) => !existingItems.some((item) => item.id === id),
      );
      return res.status(400).json({
        error: "Invalid menu items",
        message: `Menu items with IDs ${missingIds.join(", ")} do not exist`,
      });
    }

    // Create order and order items in a transaction
    const order = await prisma.order.create({
      data: {
        userId: parseInt(userId),
        addressId: addressId ? parseInt(addressId) : null,
        status: "pending",
        items: {
          create: finalItems,
        },
      },
      include: {
        items: {
          include: { menuItem: true },
        },
        address: true,
      },
    });

    console.log("Order created successfully:", order.id);
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (err) {
    console.error("Create order error:", err);
    next(err);
  }
};

// Get all orders for a user
exports.getUserOrders = async (req, res, next) => {
  try {
    const paramUserId = parseInt(req.params.userId);
    const tokenUserId = req.user ? req.user.userId : null;

    // Use token user ID if available and matches, or param user ID if admin
    let userId;
    if (
      tokenUserId &&
      (tokenUserId === paramUserId || req.user.role === "admin")
    ) {
      userId = paramUserId;
    } else if (tokenUserId) {
      userId = tokenUserId; // Regular user can only see their own orders
    } else {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    if (!userId || userId < 1) {
      return res.status(400).json({
        error: "Invalid user ID",
        message: "Valid user ID is required",
      });
    }

    console.log("Fetching orders for user:", userId);

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        address: true,
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to last 50 orders for performance
    });

    console.log(`Found ${orders.length} orders for user ${userId}`);
    res.json(orders);
  } catch (err) {
    console.error("Get user orders error:", err);
    next(err);
  }
};

// Update order status (admin or kitchen)
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { status } = req.body;
    const allowedStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "delivered",
      "cancelled",
    ];
    if (!orderId || !status)
      return res.status(400).json({ error: "orderId and status required" });
    if (!allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json({ error: "Invalid status value", allowed: allowedStatuses });
    }
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true },
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    console.log("Admin fetching all orders for user:", req.user);
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        address: true,
        items: {
          include: { menuItem: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    console.log(`Found ${orders.length} orders for admin`);
    res.json(orders);
  } catch (err) {
    console.error("Get all orders error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Get current user's orders
exports.getMyOrders = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Valid authentication required",
      });
    }

    const userId = req.user.userId;
    console.log("Fetching orders for authenticated user:", userId);

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit for performance
    });

    console.log(`Found ${orders.length} orders for user ${userId}`);
    res.json(orders);
  } catch (err) {
    console.error("Get my orders error:", err);
    next(err);
  }
};
