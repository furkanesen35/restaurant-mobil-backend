-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "loyaltyPointsAwarded" INTEGER NOT NULL DEFAULT 0;

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
