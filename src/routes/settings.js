const express = require('express');
const router = express.Router();
const {
  getSetting,
  getAllSettings,
  updateSetting,
  deleteSetting
} = require('../controllers/settingsController');

// GET all settings
router.get('/', getAllSettings);

// GET a specific setting
router.get('/:key', getSetting);

// PUT update or create a setting (admin only - you may want to add auth middleware)
router.put('/:key', updateSetting);

// DELETE a setting (admin only - you may want to add auth middleware)
router.delete('/:key', deleteSetting);

module.exports = router;
