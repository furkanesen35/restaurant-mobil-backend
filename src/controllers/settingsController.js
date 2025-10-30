const { PrismaClient } = require('../generated/prisma');
const logger = require('../utils/logger');
const prisma = new PrismaClient();

// Get a specific setting by key
const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await prisma.settings.findUnique({
      where: { key }
    });

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(setting);
  } catch (error) {
    logger.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
};

// Get all settings
const getAllSettings = async (req, res) => {
  try {
    const settings = await prisma.settings.findMany({
      orderBy: { key: 'asc' }
    });

    res.json(settings);
  } catch (error) {
    logger.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// Update or create a setting
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }

    // Upsert: update if exists, create if doesn't
    const setting = await prisma.settings.upsert({
      where: { key },
      update: { 
        value,
        description: description || null
      },
      create: { 
        key,
        value,
        description: description || null
      }
    });

    res.json(setting);
  } catch (error) {
    logger.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
};

// Delete a setting
const deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;

    await prisma.settings.delete({
      where: { key }
    });

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    logger.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
};

module.exports = {
  getSetting,
  getAllSettings,
  updateSetting,
  deleteSetting
};

