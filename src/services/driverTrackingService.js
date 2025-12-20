const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const googleMapsService = require('./googleMapsService');
const logger = require('../utils/logger');

class DriverTrackingService {
  /**
   * Update driver location (called every 1 minute from driver app)
   * @param {number} orderId - Order ID
   * @param {number} latitude - Driver's current latitude
   * @param {number} longitude - Driver's current longitude
   * @returns {Promise<Object>} Updated tracking info with ETA
   */
  async updateDriverLocation(orderId, latitude, longitude) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { address: true }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'out_for_delivery') {
      throw new Error('Order is not out for delivery');
    }

    if (!order.address) {
      throw new Error('Order has no delivery address');
    }

    let routeInfo = null;
    let eta = null;

    // Try to get ETA from Google Maps (if configured)
    if (googleMapsService.isConfigured()) {
      try {
        const customerAddress = `${order.address.street}, ${order.address.postalCode} ${order.address.city}`;
        const customerLocation = await googleMapsService.geocodeAddress(customerAddress);

        routeInfo = await googleMapsService.getDistanceMatrix(
          latitude,
          longitude,
          customerLocation.latitude,
          customerLocation.longitude
        );

        eta = routeInfo.eta;
      } catch (error) {
        logger.error('Failed to get route info from Google Maps:', error.message);
        // Continue without route info - location will still be updated
      }
    }

    // Update order with current driver location
    await prisma.order.update({
      where: { id: orderId },
      data: {
        driverLatitude: latitude,
        driverLongitude: longitude,
        driverLocationUpdatedAt: new Date(),
        ...(eta && { estimatedDeliveryTime: eta })
      }
    });

    // Store location history (for route replay/debugging)
    await prisma.driverLocationHistory.create({
      data: {
        orderId: orderId,
        latitude: latitude,
        longitude: longitude
      }
    });

    logger.info(`[TRACKING] Updated location for order ${orderId}: ${latitude}, ${longitude}`);

    return {
      success: true,
      orderId,
      location: { latitude, longitude },
      eta: eta,
      durationText: routeInfo?.durationText || null,
      distanceText: routeInfo?.distanceText || null
    };
  }

  /**
   * Get current tracking info for an order
   * @param {number} orderId - Order ID
   * @returns {Promise<Object>} Complete tracking information
   */
  async getTrackingInfo(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        address: true,
        statusHistory: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    let routeInfo = null;
    let customerLocation = null;

    // If driver location is available and Google Maps is configured, get current route
    if (order.driverLatitude && order.driverLongitude && order.address && googleMapsService.isConfigured()) {
      try {
        const customerAddress = `${order.address.street}, ${order.address.postalCode} ${order.address.city}`;
        customerLocation = await googleMapsService.geocodeAddress(customerAddress);

        routeInfo = await googleMapsService.getDirections(
          order.driverLatitude,
          order.driverLongitude,
          customerLocation.latitude,
          customerLocation.longitude
        );
      } catch (error) {
        logger.error('Failed to get route info:', error.message);
        // Continue without route info
      }
    }

    // Get restaurant location from environment
    const restaurantLat = parseFloat(process.env.RESTAURANT_LATITUDE) || null;
    const restaurantLng = parseFloat(process.env.RESTAURANT_LONGITUDE) || null;

    return {
      orderId: order.id,
      status: order.status,
      driverName: order.driverName,
      driverPhone: order.driverPhone,
      driverLocation: order.driverLatitude ? {
        latitude: order.driverLatitude,
        longitude: order.driverLongitude,
        updatedAt: order.driverLocationUpdatedAt
      } : null,
      customerLocation: customerLocation ? {
        latitude: customerLocation.latitude,
        longitude: customerLocation.longitude,
        address: order.address ? `${order.address.street}, ${order.address.postalCode} ${order.address.city}` : null
      } : (order.address ? {
        address: `${order.address.street}, ${order.address.postalCode} ${order.address.city}`
      } : null),
      restaurantLocation: (restaurantLat && restaurantLng) ? {
        latitude: restaurantLat,
        longitude: restaurantLng,
        address: process.env.RESTAURANT_ADDRESS || null
      } : null,
      route: routeInfo ? {
        distanceMeters: routeInfo.distanceMeters,
        distanceText: routeInfo.distanceText,
        durationSeconds: routeInfo.durationSeconds,
        durationText: routeInfo.durationText,
        polyline: routeInfo.polyline
      } : null,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      statusHistory: order.statusHistory
    };
  }

  /**
   * Get location history for an order (for debugging/replay)
   * @param {number} orderId - Order ID
   * @returns {Promise<Array>} Array of location points
   */
  async getLocationHistory(orderId) {
    const history = await prisma.driverLocationHistory.findMany({
      where: { orderId },
      orderBy: { timestamp: 'asc' }
    });

    return history.map(point => ({
      latitude: point.latitude,
      longitude: point.longitude,
      timestamp: point.timestamp
    }));
  }

  /**
   * Clear driver tracking data when delivery is complete
   * @param {number} orderId - Order ID
   */
  async clearDriverLocation(orderId) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        driverLatitude: null,
        driverLongitude: null,
        driverLocationUpdatedAt: null
      }
    });

    logger.info(`[TRACKING] Cleared driver location for order ${orderId}`);
  }
}

module.exports = new DriverTrackingService();
