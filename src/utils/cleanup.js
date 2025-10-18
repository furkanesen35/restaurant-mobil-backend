const { PrismaClient } = require("../generated/prisma");
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

    console.log(`Cleanup completed:`);
    console.log(`- Deleted ${deletedAddresses.count} temporary addresses`);
    console.log(`- Deleted ${deletedPaymentMethods.count} temporary payment methods`);

    return {
      addresses: deletedAddresses.count,
      paymentMethods: deletedPaymentMethods.count,
    };
  } catch (err) {
    console.error("Error during cleanup:", err);
    throw err;
  }
};

// If running this file directly for manual cleanup
if (require.main === module) {
  const daysOld = process.argv[2] ? parseInt(process.argv[2]) : 30;
  console.log(`Running cleanup for temporary data older than ${daysOld} days...`);
  
  exports.cleanupTemporaryData(daysOld)
    .then((result) => {
      console.log("Cleanup successful:", result);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Cleanup failed:", err);
      process.exit(1);
    });
}
