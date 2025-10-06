const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { userId, items } = req.body; // items: [{ menuItemId, quantity }]
    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'userId and items are required' });
    }
    // Create order and order items in a transaction
    const order = await prisma.order.create({
      data: {
        userId,
        status: 'pending',
        items: {
          create: items.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity || 1
          }))
        }
      },
      include: { items: true }
    });
    res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get all orders for a user
exports.getUserOrders = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { menuItem: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Update order status (admin or kitchen)
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { status } = req.body;
    if (!orderId || !status) return res.status(400).json({ error: 'orderId and status required' });
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true }
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
