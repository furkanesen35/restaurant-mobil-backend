const cron = require('node-cron');
const { PrismaClient } = require('../generated/prisma');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Cleanup job for temporary data
 * - Removes temporary addresses older than 24 hours
 * - Removes temporary payment methods older than 24 hours
 * - Cleans up expired visit tokens
 */
const scheduleCleanupJob = () => {
  // Run every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Running cleanup job...');
    
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Clean up temporary addresses (not associated with any orders)
      const deletedAddresses = await prisma.address.deleteMany({
        where: {
          temporary: true,
          createdAt: { lt: twentyFourHoursAgo },
          orders: { none: {} }, // Only delete if not linked to any orders
        },
      });
      
      if (deletedAddresses.count > 0) {
        logger.info(`Cleaned up ${deletedAddresses.count} temporary addresses`);
      }
      
      // Clean up temporary payment methods
      const deletedPaymentMethods = await prisma.paymentMethod.deleteMany({
        where: {
          temporary: true,
          createdAt: { lt: twentyFourHoursAgo },
        },
      });
      
      if (deletedPaymentMethods.count > 0) {
        logger.info(`Cleaned up ${deletedPaymentMethods.count} temporary payment methods`);
      }
      
      // Clean up expired visit tokens (older than 30 days and not redeemed)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const expiredTokens = await prisma.visitToken.updateMany({
        where: {
          isActive: true,
          redeemedAt: null,
          OR: [
            { expiresAt: { lt: new Date() } },
            { 
              expiresAt: null,
              createdAt: { lt: thirtyDaysAgo }
            },
          ],
        },
        data: {
          isActive: false,
        },
      });
      
      if (expiredTokens.count > 0) {
        logger.info(`Deactivated ${expiredTokens.count} expired visit tokens`);
      }
      
      // Clean up old notification logs (older than 90 days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const deletedNotifications = await prisma.notificationLog.deleteMany({
        where: {
          sentAt: { lt: ninetyDaysAgo },
        },
      });
      
      if (deletedNotifications.count > 0) {
        logger.info(`Cleaned up ${deletedNotifications.count} old notification logs`);
      }
      
      logger.info('Cleanup job completed');
    } catch (err) {
      logger.error('Cleanup job failed:', err);
    }
  });
  
  logger.info('Cleanup job scheduled (runs every 6 hours)');
};

module.exports = { scheduleCleanupJob };
