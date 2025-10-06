const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

// Get all menu categories and items
router.get('/', menuController.getMenu);

// Get a single menu item by id
router.get('/item/:id', menuController.getMenuItem);

// Seed menu data (for development)
router.post('/seed', menuController.seedMenu);

module.exports = router;
