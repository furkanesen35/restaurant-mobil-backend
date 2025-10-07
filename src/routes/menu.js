const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { menuValidation } = require('../middleware/validation');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Get all menu categories and items (public)
router.get('/', menuController.getMenu);

// Get a single menu item by id (public)
router.get('/item/:id', menuValidation.getItem, menuController.getMenuItem);

// Admin routes for menu management
router.post('/item', authenticate, requireAdmin, menuController.createMenuItem);
router.put('/item/:id', authenticate, requireAdmin, menuValidation.getItem, menuController.updateMenuItem);
router.delete('/item/:id', authenticate, requireAdmin, menuValidation.getItem, menuController.deleteMenuItem);

// Seed menu data (for development only)
router.post('/seed', menuController.seedMenu);

module.exports = router;
