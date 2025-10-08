const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Create Payment Method
exports.createPaymentMethod = async (req, res) => {
  try {
    const { type, cardNumber, cardHolder, expiry, brand, paypalEmail, isDefault } = req.body;
  const userId = req.user.userId;
    const paymentMethod = await prisma.paymentMethod.create({
      data: { type, cardNumber, cardHolder, expiry, brand, paypalEmail, isDefault, userId },
    });
    res.status(201).json(paymentMethod);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all payment methods for user
exports.getPaymentMethods = async (req, res) => {
  try {
  const userId = req.user.userId;
    const paymentMethods = await prisma.paymentMethod.findMany({ where: { userId } });
    res.json(paymentMethods);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update Payment Method
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, cardNumber, cardHolder, expiry, brand, paypalEmail, isDefault } = req.body;
    const paymentMethod = await prisma.paymentMethod.update({
      where: { id: parseInt(id) },
      data: { type, cardNumber, cardHolder, expiry, brand, paypalEmail, isDefault },
    });
    res.json(paymentMethod);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Payment Method
exports.deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.paymentMethod.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
