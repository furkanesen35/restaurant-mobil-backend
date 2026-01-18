const express = require('express');
const router = express.Router();
const {
  getSetting,
  getAllSettings,
  updateSetting,
  deleteSetting
} = require('../controllers/settingsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET all settings
router.get('/', getAllSettings);

// GET a specific setting
router.get('/:key', getSetting);

// PUT update or create a setting (admin only)
router.put('/:key', authenticate, requireAdmin, updateSetting);

// DELETE a setting (admin only)
router.delete('/:key', authenticate, requireAdmin, deleteSetting);

module.exports = router;
