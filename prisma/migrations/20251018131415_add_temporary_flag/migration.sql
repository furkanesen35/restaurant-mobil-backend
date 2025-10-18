-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "temporary" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PaymentMethod" ADD COLUMN     "temporary" BOOLEAN NOT NULL DEFAULT false;
