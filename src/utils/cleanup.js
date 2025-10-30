const { PrismaClient } = require('../generated/prisma');
const logger = require('./logger');
const prisma = new PrismaClient();

/**
 * Clean up temporary addresses and payment methods
 * These are one-time use items that users chose not to save to their profile
 * Run this periodically (e.g., daily cron job) to keep the database clean
 *
 * Optionally, you can set a time threshold (e.g., delete temporary items older than 30 days)
 */
exports.cleanupTemporaryData = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Delete temporary addresses older than cutoff
    const deletedAddresses = await prisma.address.deleteMany({
      where: {
        temporary: true,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    // Delete temporary payment methods older than cutoff
    const deletedPaymentMethods = await prisma.paymentMethod.deleteMany({
      where: {
        temporary: true,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Cleanup completed:`);
    logger.info(`- Deleted ${deletedAddresses.count} temporary addresses`);
    logger.info(
      `- Deleted ${deletedPaymentMethods.count} temporary payment methods`
    );

    return {
      addresses: deletedAddresses.count,
      paymentMethods: deletedPaymentMethods.count,
    };
  } catch (err) {
    logger.error("Error during cleanup:", err);
    throw err;
  }
};

// If running this file directly for manual cleanup
if (require.main === module) {
  const daysOld = process.argv[2] ? parseInt(process.argv[2]) : 30;
  logger.info(
    `Running cleanup for temporary data older than ${daysOld} days...`
  );

  exports
    .cleanupTemporaryData(daysOld)
    .then((result) => {
      logger.info("Cleanup successful:", result);
      process.exit(0);
    })
    .catch((err) => {
      logger.error("Cleanup failed:", err);
      process.exit(1);
    });
}

