const { PrismaClient } = require('./src/generated/prisma');
const logger = require('./src/utils/logger');
const prisma = new PrismaClient();

async function seedSettings() {
  try {
    // Create or update minimum order value setting
    const minOrderValue = await prisma.settings.upsert({
      where: { key: 'minOrderValue' },
      update: { 
        value: '15.00',
        description: 'Minimum order value in EUR'
      },
      create: { 
        key: 'minOrderValue',
        value: '15.00',
        description: 'Minimum order value in EUR'
      }
    });
    
    logger.info('✓ Minimum order value setting created:', minOrderValue);
    
  } catch (error) {
    logger.error('Error seeding settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSettings();
