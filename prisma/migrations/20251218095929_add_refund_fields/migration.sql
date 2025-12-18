-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "refundAmount" DOUBLE PRECISION,
ADD COLUMN     "refundId" TEXT,
ADD COLUMN     "refundStatus" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3);
