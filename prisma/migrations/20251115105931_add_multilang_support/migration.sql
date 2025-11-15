-- AlterTable
ALTER TABLE "MenuCategory" ADD COLUMN     "nameDe" TEXT,
ADD COLUMN     "nameEn" TEXT;

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "descriptionDe" TEXT,
ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "nameDe" TEXT,
ADD COLUMN     "nameEn" TEXT;
