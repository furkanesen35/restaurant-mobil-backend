-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "allergens" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSpicy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVegan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVegetarian" BOOLEAN NOT NULL DEFAULT false;
