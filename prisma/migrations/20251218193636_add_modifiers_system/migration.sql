-- DropIndex
DROP INDEX "public"."CartItem_userId_menuItemId_key";

-- CreateTable
CREATE TABLE "MenuItemModifier" (
    "id" SERIAL NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "nameDe" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "maxQuantity" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItemModifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItemModifier" (
    "id" SERIAL NOT NULL,
    "orderItemId" INTEGER NOT NULL,
    "modifierId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceAtOrder" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItemModifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItemModifier" (
    "id" SERIAL NOT NULL,
    "cartItemId" INTEGER NOT NULL,
    "modifierId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartItemModifier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuItemModifier_menuItemId_idx" ON "MenuItemModifier"("menuItemId");

-- CreateIndex
CREATE INDEX "OrderItemModifier_orderItemId_idx" ON "OrderItemModifier"("orderItemId");

-- CreateIndex
CREATE INDEX "CartItemModifier_cartItemId_idx" ON "CartItemModifier"("cartItemId");

-- CreateIndex
CREATE INDEX "CartItem_userId_menuItemId_idx" ON "CartItem"("userId", "menuItemId");

-- AddForeignKey
ALTER TABLE "MenuItemModifier" ADD CONSTRAINT "MenuItemModifier_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemModifier" ADD CONSTRAINT "OrderItemModifier_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemModifier" ADD CONSTRAINT "OrderItemModifier_modifierId_fkey" FOREIGN KEY ("modifierId") REFERENCES "MenuItemModifier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItemModifier" ADD CONSTRAINT "CartItemModifier_cartItemId_fkey" FOREIGN KEY ("cartItemId") REFERENCES "CartItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItemModifier" ADD CONSTRAINT "CartItemModifier_modifierId_fkey" FOREIGN KEY ("modifierId") REFERENCES "MenuItemModifier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
