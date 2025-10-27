const { PrismaClient } = require('../src/generated/prisma');

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.$executeRawUnsafe(`
      UPDATE "Order" o
      SET "loyaltyPointsAwarded" = COALESCE(
        (
          SELECT CAST(FLOOR(SUM(oi."quantity" * mi."price" * COALESCE(oi."loyaltyPointsMultiplier", 1.0))) AS INTEGER)
          FROM "OrderItem" oi
          JOIN "MenuItem" mi ON mi."id" = oi."menuItemId"
          WHERE oi."orderId" = o."id"
        ),
        0
      );
    `);
    console.log(`Backfill complete. Rows affected: ${result}`);
  } catch (error) {
    console.error('Error backfilling loyaltyPointsAwarded:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
