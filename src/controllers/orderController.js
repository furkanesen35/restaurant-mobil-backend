// Delete order (admin only)
exports.deleteOrder = async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    logger.info("[DELETE] Attempting to delete order:", orderId);
    if (!orderId) {
      logger.info("[DELETE] No orderId provided");
      return res.status(400).json({ error: "orderId required" });
    }

    // Get order with items to calculate loyalty points to deduct
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!existingOrder) {
      logger.info("[DELETE] Order not found:", orderId);
      return res.status(404).json({ error: "Order not found" });
    }

    // Calculate loyalty points that were earned from this order (prefer stored value)
    const recalculatedPoints = Math.floor(
      existingOrder.items.reduce((sum, item) => {
        const itemPrice = item.menuItem.price * item.quantity;
        const multiplier = item.loyaltyPointsMultiplier || 1.0;
        return sum + (itemPrice * multiplier);
      }, 0)
    );

    let loyaltyPointsEarned = existingOrder.loyaltyPointsAwarded ?? 0;
    if (!loyaltyPointsEarned && recalculatedPoints) {
      loyaltyPointsEarned = recalculatedPoints;
    }

    // Only deduct points if order wasn't already cancelled
    const shouldDeductPoints = existingOrder.status !== "cancelled";

    logger.info(`[DELETE] Order status: ${existingOrder.status}, Points to deduct: ${shouldDeductPoints ? loyaltyPointsEarned : 0}`);

    // Delete order and deduct loyalty points in transaction
    let newLoyaltyBalance = null;
    await prisma.$transaction(async (tx) => {
      // Deduct loyalty points if order wasn't cancelled
      if (shouldDeductPoints && loyaltyPointsEarned > 0) {
        logger.info(`[DELETE] Deducting ${loyaltyPointsEarned} points from user ${existingOrder.userId}`);
        const updatedUser = await tx.user.update({
          where: { id: existingOrder.userId },
          data: {
            loyaltyPoints: {
              decrement: loyaltyPointsEarned,
            },
          },
          select: {
            loyaltyPoints: true,
          },
        });
        newLoyaltyBalance = updatedUser.loyaltyPoints;
        logger.info(`[DELETE] User's new loyalty points balance: ${newLoyaltyBalance}`);
      }

      // Cascade delete will handle related OrderItems automatically
      await tx.order.delete({ where: { id: orderId } });
    });

    logger.info("[DELETE] Order deleted (cascade):", orderId);
    
    if (newLoyaltyBalance === null) {
      const user = await prisma.user.findUnique({
        where: { id: existingOrder.userId },
        select: { loyaltyPoints: true },
      });
      newLoyaltyBalance = user?.loyaltyPoints ?? null;
      logger.info(`[DELETE] (No deduction) Current user loyalty balance: ${newLoyaltyBalance}`);
    }

    res.json({
      success: true,
      loyaltyPointsDeducted: shouldDeductPoints ? loyaltyPointsEarned : 0,
      loyaltyPointsBalance: newLoyaltyBalance,
    });
  } catch (err) {
    logger.error("[DELETE] Error deleting order:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
const { PrismaClient } = require("../generated/prisma");
const logger = require('../utils/logger');
const prisma = new PrismaClient();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const {
  sendOrderStatusNotification,
  sendRefundNotification,
} = require("./notificationsController");

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

    logger.info("Full request body:", JSON.stringify(req.body, null, 2));
    logger.info("Raw request body type:", typeof req.body);
    logger.info(
      "Raw items type:",
      typeof req.body.items,
      "isArray:",
      Array.isArray(req.body.items)
    );

    const { userId: bodyUserId, items, addressId } = req.body;
    // Use userId from JWT token if available, otherwise from body
    const rawUserId = req.user ? req.user.userId : bodyUserId;
    const userIdInt =
      typeof rawUserId === "number" ? rawUserId : parseInt(rawUserId, 10);

    logger.info(
      "Extracted userId:",
      userIdInt,
      "bodyUserId:",
      bodyUserId,
      "items:",
      items,
      "addressId:",
      addressId
    );

    // Convert object to array if needed (temporary fix for serialization issue)
    let processedItems;
    if (Array.isArray(items)) {
      processedItems = items;
    } else if (typeof items === "object" && items !== null) {
      // Convert object with numeric keys to array
      processedItems = Object.values(items);
      logger.info("Converted object to array:", processedItems);
    } else {
      processedItems = [];
    }

    if (!userIdInt || !processedItems || processedItems.length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "User ID and items are required",
      });
    }

    // Convert string IDs to integers and validate
    const finalItems = processedItems.map((item) => ({
      menuItemId: parseInt(item.menuItemId),
      quantity: parseInt(item.quantity) || 1,
      modifiers: Array.isArray(item.modifiers) ? item.modifiers.map(mod => ({
        modifierId: parseInt(mod.modifierId),
        quantity: parseInt(mod.quantity) || 1,
      })) : [],
    }));

    // Validate that all menu items exist
    const menuItemIds = finalItems.map((item) => item.menuItemId);
    const existingItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    if (existingItems.length !== menuItemIds.length) {
      const missingIds = menuItemIds.filter(
        (id) => !existingItems.some((item) => item.id === id)
      );
      return res.status(400).json({
        error: "Invalid menu items",
        message: `Menu items with IDs ${missingIds.join(", ")} do not exist`,
      });
    }

    // Collect all modifier IDs and validate them
    const allModifierIds = finalItems
      .flatMap((item) => item.modifiers.map((mod) => mod.modifierId))
      .filter((id) => !isNaN(id));
    
    let existingModifiers = [];
    if (allModifierIds.length > 0) {
      existingModifiers = await prisma.menuItemModifier.findMany({
        where: { 
          id: { in: allModifierIds },
          isAvailable: true,
        },
      });

      // Validate all modifiers exist and belong to correct menu items
      for (const item of finalItems) {
        for (const mod of item.modifiers) {
          const modifier = existingModifiers.find((m) => m.id === mod.modifierId);
          if (!modifier) {
            return res.status(400).json({
              error: "Invalid modifier",
              message: `Modifier with ID ${mod.modifierId} does not exist or is unavailable`,
            });
          }
          if (modifier.menuItemId !== item.menuItemId) {
            return res.status(400).json({
              error: "Invalid modifier",
              message: `Modifier "${modifier.name}" cannot be added to this menu item`,
            });
          }
          if (mod.quantity > modifier.maxQuantity) {
            return res.status(400).json({
              error: "Invalid modifier quantity",
              message: `Modifier "${modifier.name}" can only be added up to ${modifier.maxQuantity} times`,
            });
          }
        }
      }
    }

    // Create modifier lookup map
    const modifierMap = existingModifiers.reduce((acc, mod) => {
      acc[mod.id] = mod;
      return acc;
    }, {});

    // Create item map for quantities and multipliers
    const itemQuantityMap = finalItems.reduce((acc, item) => {
      acc[item.menuItemId] = item.quantity;
      return acc;
    }, {});

    // Add multiplier and modifiers to finalItems from existing menu items
    const finalItemsWithMultiplier = finalItems.map((item) => {
      const menuItem = existingItems.find((mi) => mi.id === item.menuItemId);
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        loyaltyPointsMultiplier: menuItem?.loyaltyPointsMultiplier || 1.0,
        modifiers: item.modifiers,
      };
    });

    // Calculate order total including modifiers
    const orderTotal = finalItems.reduce((sum, item) => {
      const menuItem = existingItems.find((mi) => mi.id === item.menuItemId);
      const baseItemTotal = (menuItem?.price || 0) * item.quantity;
      
      // Calculate modifiers total for this item
      const modifiersTotal = item.modifiers.reduce((modSum, mod) => {
        const modifier = modifierMap[mod.modifierId];
        return modSum + (modifier?.price || 0) * mod.quantity;
      }, 0);
      
      // Modifiers total is multiplied by item quantity
      return sum + baseItemTotal + (modifiersTotal * item.quantity);
    }, 0);

    let validatedAddressId = null;
    if (addressId) {
      validatedAddressId = parseInt(addressId, 10);
      if (Number.isNaN(validatedAddressId)) {
        return res.status(400).json({ error: "Invalid addressId" });
      }

      const deliveryAddress = await prisma.address.findUnique({
        where: { id: validatedAddressId },
        select: { userId: true, postalCode: true },
      });

      if (!deliveryAddress || deliveryAddress.userId !== userIdInt) {
        return res.status(404).json({ error: "Delivery address not found" });
      }

      const postalCode = (deliveryAddress.postalCode || "").trim();
      const allowedPostalCode = await prisma.allowedPostalCode.findFirst({
        where: { postalCode, isActive: true },
      });

      if (!allowedPostalCode) {
        return res
          .status(422)
          .json({ error: "Selected address is outside delivery area" });
      }
    }

    // Check minimum order value
    const minOrderSetting = await prisma.settings.findUnique({
      where: { key: 'minOrderValue' }
    });
    
    if (minOrderSetting) {
      const minOrderValue = parseFloat(minOrderSetting.value);
      if (orderTotal < minOrderValue) {
        return res.status(400).json({
          error: 'Order below minimum',
          message: `Minimum order value is €${minOrderValue.toFixed(2)}. Your order total is €${orderTotal.toFixed(2)}.`,
          minOrderValue,
          currentTotal: orderTotal
        });
      }
    }

    // Calculate loyalty points with multipliers (including modifiers)
    const loyaltyPointsEarned = Math.floor(
      finalItems.reduce((sum, item) => {
        const menuItem = existingItems.find((mi) => mi.id === item.menuItemId);
        const quantity = item.quantity;
        const baseItemPrice = (menuItem?.price || 0) * quantity;
        const multiplier = menuItem?.loyaltyPointsMultiplier || 1.0;
        
        // Calculate modifiers total for this item
        const modifiersTotal = item.modifiers.reduce((modSum, mod) => {
          const modifier = modifierMap[mod.modifierId];
          return modSum + (modifier?.price || 0) * mod.quantity;
        }, 0) * quantity;
        
        return sum + ((baseItemPrice + modifiersTotal) * multiplier);
      }, 0)
    );

    // Calculate estimated delivery time (30-45 minutes from now)
    const estimatedMinutes = 30 + Math.floor(Math.random() * 16); // Random between 30-45 min
    const estimatedDeliveryTime = new Date(
      Date.now() + estimatedMinutes * 60 * 1000
    );

    // Prepare order items data with modifiers
    const orderItemsData = finalItemsWithMultiplier.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      loyaltyPointsMultiplier: item.loyaltyPointsMultiplier,
      modifiers: {
        create: item.modifiers.map((mod) => ({
          modifierId: mod.modifierId,
          quantity: mod.quantity,
          priceAtOrder: modifierMap[mod.modifierId]?.price || 0,
        })),
      },
    }));

    const [order, updatedUser] = await prisma.$transaction([
      prisma.order.create({
        data: {
          userId: userIdInt,
          addressId: validatedAddressId,
          status: "pending",
          estimatedDeliveryTime,
          loyaltyPointsAwarded: loyaltyPointsEarned,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: { 
              menuItem: true,
              modifiers: {
                include: {
                  modifier: true,
                },
              },
            },
          },
          address: true,
        },
      }),
      loyaltyPointsEarned > 0
        ? prisma.user.update({
            where: { id: userIdInt },
            data: {
              loyaltyPoints: {
                increment: loyaltyPointsEarned,
              },
            },
            select: {
              loyaltyPoints: true,
            },
          })
        : prisma.user.findUnique({
            where: { id: userIdInt },
            select: {
              loyaltyPoints: true,
            },
          }),
    ]);

    await prisma.cartItem.deleteMany({ where: { userId: userIdInt } });

    logger.info("Order created successfully:", order.id);
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
      loyaltyPointsEarned,
      loyaltyPointsBalance: updatedUser?.loyaltyPoints ?? 0,
      orderTotal,
    });
  } catch (err) {
    logger.error("Create order error:", err);
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

    logger.info("Fetching orders for user:", userId);

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
            modifiers: {
              include: {
                modifier: {
                  select: {
                    id: true,
                    name: true,
                    nameEn: true,
                    nameDe: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to last 50 orders for performance
    });

    logger.info(`Found ${orders.length} orders for user ${userId}`);
    res.json(orders);
  } catch (err) {
    logger.error("Get user orders error:", err);
    next(err);
  }
};

// Update order status (admin or kitchen)
exports.updateOrderStatus = async (req, res) => {
  try {
    // Validate request first
    const { validationResult } = require("express-validator");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.info("[UPDATE STATUS] Validation errors:", errors.array());
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const orderId = parseInt(req.params.orderId);
    const { status } = req.body;
    
    logger.info(`[UPDATE STATUS] Updating order ${orderId} to status: ${status}`);
    
    const allowedStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "delivered",
      "cancelled",
    ];
    
    if (!orderId || !status) {
      logger.info("[UPDATE STATUS] Missing orderId or status");
      return res.status(400).json({ error: "orderId and status required" });
    }
    
    if (!allowedStatuses.includes(status)) {
      logger.info("[UPDATE STATUS] Invalid status:", status);
      return res
        .status(400).json({ error: "Invalid status value", allowed: allowedStatuses });
    }

    const requestingUserId = req.user?.userId;
    const isAdmin = req.user?.role === "admin";

    if (!requestingUserId && !isAdmin) {
      logger.info("[UPDATE STATUS] Unauthorized access: missing user context");
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get the order with items to calculate points
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!existingOrder) {
      logger.info("[UPDATE STATUS] Order not found:", orderId);
      return res.status(404).json({ error: "Order not found" });
    }

    // Non-admin users can only cancel their own pending orders
    if (!isAdmin) {
      if (status !== "cancelled") {
        logger.info("[UPDATE STATUS] Non-admin tried to change status other than cancelled", { status, userId: requestingUserId });
        return res.status(403).json({ error: "Insufficient permissions for this status change" });
      }

      if (existingOrder.userId !== requestingUserId) {
        logger.info("[UPDATE STATUS] User tried to cancel order they do not own", { requestingUserId, orderOwner: existingOrder.userId });
        return res.status(403).json({ error: "You can only cancel your own orders" });
      }

      if (existingOrder.status !== "pending") {
        logger.info("[UPDATE STATUS] User tried to cancel non-pending order", { currentStatus: existingOrder.status });
        return res.status(400).json({ error: "Only pending orders can be cancelled" });
      }
    }

    // Calculate loyalty points to deduct using stored award data
    const recalculatedPoints = Math.floor(
      existingOrder.items.reduce((sum, item) => {
        const itemPrice = item.menuItem.price * item.quantity;
        const multiplier = item.loyaltyPointsMultiplier || 1.0;
        logger.info(`[UPDATE STATUS] Item: ${item.menuItem.name}, Price: ${item.menuItem.price}, Qty: ${item.quantity}, Multiplier: ${multiplier}, Points: ${itemPrice * multiplier}`);
        return sum + (itemPrice * multiplier);
      }, 0)
    );

    const loyaltyPointsAwarded = existingOrder.loyaltyPointsAwarded ?? 0;
    const loyaltyPointsToDeduct = loyaltyPointsAwarded > 0 ? loyaltyPointsAwarded : recalculatedPoints;

    logger.info(`[UPDATE STATUS] Stored loyalty points awarded: ${loyaltyPointsAwarded}, Recalculated: ${recalculatedPoints}`);
    logger.info(`[UPDATE STATUS] Total loyalty points to deduct: ${loyaltyPointsToDeduct}`);
    logger.info(`[UPDATE STATUS] Existing order status: ${existingOrder.status}, New status: ${status}`);

    // If cancelling an order that wasn't already cancelled, deduct loyalty points
    const shouldDeductPoints =
      status === "cancelled" && existingOrder.status !== "cancelled";

    // Check if we should process a refund
    const shouldProcessRefund = 
      status === "cancelled" && 
      existingOrder.status !== "cancelled" &&
      existingOrder.paymentIntentId &&
      !existingOrder.refundId;

    logger.info(`[UPDATE STATUS] Should deduct points: ${shouldDeductPoints}`);
    logger.info(`[UPDATE STATUS] Should process refund: ${shouldProcessRefund}, PaymentIntentId: ${existingOrder.paymentIntentId}`);

    // Process Stripe refund if applicable
    let refundResult = null;
    if (shouldProcessRefund) {
      try {
        logger.info(`[UPDATE STATUS] Processing Stripe refund for PaymentIntent: ${existingOrder.paymentIntentId}`);
        
        // Create refund via Stripe API
        const refund = await stripe.refunds.create({
          payment_intent: existingOrder.paymentIntentId,
          reason: 'requested_by_customer',
        });

        refundResult = {
          refundId: refund.id,
          refundStatus: refund.status, // 'pending', 'succeeded', 'failed', 'canceled'
          refundAmount: refund.amount / 100, // Convert from cents to currency units
          refundedAt: new Date(),
        };

        logger.info(`[UPDATE STATUS] Stripe refund created: ${refund.id}, Status: ${refund.status}, Amount: ${refundResult.refundAmount}`);
      } catch (refundErr) {
        // Log refund error but don't fail the cancellation
        logger.error(`[UPDATE STATUS] Stripe refund failed:`, refundErr);
        refundResult = {
          refundId: null,
          refundStatus: 'failed',
          refundAmount: null,
          refundedAt: null,
          refundError: refundErr.message,
        };
      }
    }

    // Update order status and handle loyalty points in transaction
    let updatedUser = null;
    const order = await prisma.$transaction(async (tx) => {
      // Build update data
      const updateData = { 
        status,
        ...(refundResult && refundResult.refundId ? {
          refundId: refundResult.refundId,
          refundStatus: refundResult.refundStatus,
          refundAmount: refundResult.refundAmount,
          refundedAt: refundResult.refundedAt,
        } : refundResult?.refundStatus === 'failed' ? {
          refundStatus: 'failed',
        } : {}),
      };

      // Update the order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: { items: true },
      });

      // Deduct loyalty points if cancelling
      if (shouldDeductPoints && loyaltyPointsToDeduct > 0) {
        logger.info(`[UPDATE STATUS] Deducting ${loyaltyPointsToDeduct} points from user ${existingOrder.userId}`);
        updatedUser = await tx.user.update({
          where: { id: existingOrder.userId },
          data: {
            loyaltyPoints: {
              decrement: loyaltyPointsToDeduct,
            },
          },
          select: {
            loyaltyPoints: true,
          },
        });
        logger.info(`[UPDATE STATUS] User's new loyalty points balance: ${updatedUser.loyaltyPoints}`);
      }

      return updatedOrder;
    });

    logger.info(`[UPDATE STATUS] Order ${orderId} updated to ${status}`);
    logger.info(`[UPDATE STATUS] Response - loyaltyPointsDeducted: ${shouldDeductPoints ? loyaltyPointsToDeduct : 0}, loyaltyPointsBalance: ${updatedUser?.loyaltyPoints}`);

    // Build response with refund info
    const response = {
      ...order,
      loyaltyPointsDeducted: shouldDeductPoints ? loyaltyPointsToDeduct : 0,
      loyaltyPointsBalance: updatedUser?.loyaltyPoints,
    };

    if (refundResult) {
      response.refund = {
        refundId: refundResult.refundId,
        refundStatus: refundResult.refundStatus,
        refundAmount: refundResult.refundAmount,
        refundedAt: refundResult.refundedAt,
        ...(refundResult.refundError && { error: refundResult.refundError }),
      };
    }

    res.json(response);

    // Send push notification for status change
    sendOrderStatusNotification(orderId, status);

    // Send refund notification if refund was processed
    if (refundResult && refundResult.refundAmount) {
      sendRefundNotification(orderId, refundResult.refundAmount, refundResult.refundStatus);
    }
  } catch (err) {
    logger.error("[UPDATE STATUS] Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    logger.info("Admin fetching all orders for user:", req.user);
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
    logger.info(`Found ${orders.length} orders for admin`);
    res.json(orders);
  } catch (err) {
    logger.error("Get all orders error:", err);
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
    logger.info("Fetching orders for authenticated user:", userId);

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

    logger.info(`Found ${orders.length} orders for user ${userId}`);
    res.json(orders);
  } catch (err) {
    logger.error("Get my orders error:", err);
    next(err);
  }
};

