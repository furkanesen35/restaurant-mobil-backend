-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "specialInstructions" TEXT;

-- AlterTable
ALTER TABLE "MenuItemModifier" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'addition';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "specialInstructions" TEXT;

-- CreateIndex
CREATE INDEX "MenuItemModifier_type_idx" ON "MenuItemModifier"("type");
