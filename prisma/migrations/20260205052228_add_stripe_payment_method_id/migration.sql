/*
  Warnings:

  - A unique constraint covering the columns `[stripePaymentMethodId]` on the table `PaymentMethod` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PaymentMethod" ADD COLUMN     "stripePaymentMethodId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_stripePaymentMethodId_key" ON "PaymentMethod"("stripePaymentMethodId");
