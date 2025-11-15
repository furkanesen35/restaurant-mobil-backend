const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function backfillTranslations() {
  try {
    console.log('Starting translation backfill...');

    // Get all menu items
    const items = await prisma.menuItem.findMany();
    console.log(`Found ${items.length} menu items to update`);

    let updated = 0;
    for (const item of items) {
      const updateData = {};
      
      // If nameDe is null, use name
      if (!item.nameDe && item.name) {
        updateData.nameDe = item.name;
      }
      
      // If descriptionDe is null, use description
      if (!item.descriptionDe && item.description) {
        updateData.descriptionDe = item.description;
      }

      // Only update if there's something to update
      if (Object.keys(updateData).length > 0) {
        await prisma.menuItem.update({
          where: { id: item.id },
          data: updateData,
        });
        updated++;
        console.log(`Updated item #${item.id}: ${item.name}`);
      }
    }

    // Also update categories
    const categories = await prisma.menuCategory.findMany();
    console.log(`\nFound ${categories.length} categories to update`);
    
    let categoriesUpdated = 0;
    for (const cat of categories) {
      const updateData = {};
      
      if (!cat.nameDe && cat.name) {
        updateData.nameDe = cat.name;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.menuCategory.update({
          where: { id: cat.id },
          data: updateData,
        });
        categoriesUpdated++;
        console.log(`Updated category #${cat.id}: ${cat.name}`);
      }
    }

    console.log(`\n✅ Backfill complete!`);
    console.log(`   - ${updated} menu items updated`);
    console.log(`   - ${categoriesUpdated} categories updated`);
  } catch (err) {
    console.error('Error during backfill:', err);
  } finally {
    await prisma.$disconnect();
  }
}

backfillTranslations();
