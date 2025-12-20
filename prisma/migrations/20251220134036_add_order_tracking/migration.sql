-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "driverLatitude" DOUBLE PRECISION,
ADD COLUMN     "driverLocationUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "driverLongitude" DOUBLE PRECISION,
ADD COLUMN     "driverName" TEXT,
ADD COLUMN     "driverPhone" TEXT;

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverLocationHistory" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverLocationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_timestamp_idx" ON "OrderStatusHistory"("timestamp");

-- CreateIndex
CREATE INDEX "DriverLocationHistory_orderId_idx" ON "DriverLocationHistory"("orderId");

-- CreateIndex
CREATE INDEX "DriverLocationHistory_timestamp_idx" ON "DriverLocationHistory"("timestamp");

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverLocationHistory" ADD CONSTRAINT "DriverLocationHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
