const express = require("express");
const router = express.Router();
const { authenticate, requireAdmin } = require("../middleware/auth");
const driverTrackingService = require("../services/driverTrackingService");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const logger = require("../utils/logger");
const { sendOrderStatusNotification } = require("../controllers/notificationsController");

// Allowed order statuses including out_for_delivery
const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled'
];

/**
 * POST /api/delivery/assign-driver/:orderId
 * Admin: Assign a driver to an order and set it to out_for_delivery
 */
router.post("/assign-driver/:orderId", authenticate, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { driverName, driverPhone, estimatedMinutes } = req.body;

    if (!driverName) {
      return res.status(400).json({ error: "Driver name is required" });
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { user: true }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status !== 'ready') {
      return res.status(400).json({ 
        error: "Order must be in 'ready' status before assigning driver",
        currentStatus: order.status
      });
    }

    // Calculate estimated delivery time
    const eta = estimatedMinutes 
      ? new Date(Date.now() + estimatedMinutes * 60000)
      : null;

    // Update order with driver info (keep status as 'ready' - no out_for_delivery)
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        driverName,
        driverPhone: driverPhone || null,
        estimatedDeliveryTime: eta
      }
    });

    // Create status history entry for driver assignment
    await prisma.orderStatusHistory.create({
      data: {
        orderId: parseInt(orderId),
        status: 'ready',
        message: `${driverName} is on the way with your order`
      }
    });

    // Send push notification to customer
    if (order.user?.pushToken) {
      try {
        await sendOrderStatusNotification(
          order.userId,
          parseInt(orderId),
          'ready'  // Keep as 'ready', notification will include driver info
        );
      } catch (notifError) {
        logger.error('Failed to send notification:', notifError);
      }
    }

    logger.info(`[DELIVERY] Driver ${driverName} assigned to order ${orderId}`);

    res.json({ 
      success: true, 
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        driverName: updatedOrder.driverName,
        driverPhone: updatedOrder.driverPhone,
        estimatedDeliveryTime: updatedOrder.estimatedDeliveryTime
      }
    });
  } catch (error) {
    logger.error('Failed to assign driver:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/delivery/update-location/:orderId
 * Driver: Update current location (called every 1 minute)
 */
router.post("/update-location/:orderId", authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: "Latitude and longitude must be numbers" });
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ error: "Latitude must be between -90 and 90" });
    }
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: "Longitude must be between -180 and 180" });
    }

    const result = await driverTrackingService.updateDriverLocation(
      parseInt(orderId),
      latitude,
      longitude
    );

    res.json(result);
  } catch (error) {
    logger.error('Failed to update driver location:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/delivery/track/:orderId
 * Customer: Get tracking info for their order
 */
router.get("/track/:orderId", authenticate, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    // Verify user owns this order (or is admin)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (!isAdmin && order.userId !== userId) {
      return res.status(403).json({ error: "You can only track your own orders" });
    }

    const trackingInfo = await driverTrackingService.getTrackingInfo(orderId);
    res.json(trackingInfo);
  } catch (error) {
    logger.error('Failed to get tracking info:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/delivery/mark-delivered/:orderId
 * Admin/Driver: Mark order as delivered
 */
router.post("/mark-delivered/:orderId", authenticate, requireAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Allow marking as delivered from 'ready' (with driver) or 'out_for_delivery'
    const canDeliver = order.status === 'out_for_delivery' || 
                       (order.status === 'ready' && order.driverName);
    if (!canDeliver) {
      return res.status(400).json({ 
        error: "Order must be 'ready' with driver assigned to mark as delivered",
        currentStatus: order.status
      });
    }

    // Update order status and clear driver location
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'delivered',
        driverLatitude: null,
        driverLongitude: null,
        driverLocationUpdatedAt: null
      }
    });

    // Create status history entry
    await prisma.orderStatusHistory.create({
      data: {
        orderId: orderId,
        status: 'delivered',
        message: 'Your order has been delivered. Enjoy your meal!'
      }
    });

    // Send notification to customer
    try {
      await sendOrderStatusNotification(order.userId, orderId, 'delivered');
    } catch (notifError) {
      logger.error('Failed to send delivery notification:', notifError);
    }

    logger.info(`[DELIVERY] Order ${orderId} marked as delivered`);

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to mark order as delivered:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/delivery/location-history/:orderId
 * Admin: Get driver location history for an order
 */
router.get("/location-history/:orderId", authenticate, requireAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const history = await driverTrackingService.getLocationHistory(orderId);
    res.json({ orderId, history });
  } catch (error) {
    logger.error('Failed to get location history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/delivery/active
 * Admin: Get all orders currently out for delivery
 */
router.get("/active", authenticate, requireAdmin, async (req, res) => {
  try {
    const activeDeliveries = await prisma.order.findMany({
      where: { status: 'out_for_delivery' },
      include: {
        address: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(activeDeliveries.map(order => ({
      orderId: order.id,
      customerName: order.user?.name,
      deliveryAddress: order.address 
        ? `${order.address.street}, ${order.address.postalCode} ${order.address.city}`
        : null,
      driverName: order.driverName,
      driverPhone: order.driverPhone,
      driverLocation: order.driverLatitude ? {
        latitude: order.driverLatitude,
        longitude: order.driverLongitude,
        updatedAt: order.driverLocationUpdatedAt
      } : null,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      createdAt: order.createdAt
    })));
  } catch (error) {
    logger.error('Failed to get active deliveries:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
