-- CreateTable
CREATE TABLE "VisitToken" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "redeemedById" INTEGER,
    "redeemedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "restaurantLocation" TEXT,
    "notes" TEXT,

    CONSTRAINT "VisitToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisitToken_code_key" ON "VisitToken"("code");

-- CreateIndex
CREATE INDEX "VisitToken_code_idx" ON "VisitToken"("code");

-- CreateIndex
CREATE INDEX "VisitToken_isActive_expiresAt_idx" ON "VisitToken"("isActive", "expiresAt");

-- AddForeignKey
ALTER TABLE "VisitToken" ADD CONSTRAINT "VisitToken_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitToken" ADD CONSTRAINT "VisitToken_redeemedById_fkey" FOREIGN KEY ("redeemedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
