const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Create a new order
router.post('/', orderController.createOrder);

// Get all orders for a user
router.get('/user/:userId', orderController.getUserOrders);

// Update order status
router.patch('/:orderId/status', orderController.updateOrderStatus);

// Get all orders (admin only)
router.get('/all', authenticate, requireAdmin, orderController.getAllOrders);

module.exports = router;
