-- CreateTable
CREATE TABLE "AllowedPostalCode" (
    "id" SERIAL NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "radiusKm" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AllowedPostalCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AllowedPostalCode_postalCode_key" ON "AllowedPostalCode"("postalCode");

-- CreateIndex
CREATE INDEX "AllowedPostalCode_isActive_sortOrder_idx" ON "AllowedPostalCode"("isActive", "sortOrder");
