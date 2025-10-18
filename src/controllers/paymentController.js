const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Create Payment Method
exports.createPaymentMethod = async (req, res) => {
  try {
    const {
      type,
      cardNumber,
      cardHolder,
      expiry,
      brand,
      paypalEmail,
      isDefault,
    } = req.body;
    const userId = req.user.userId;
    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        type,
        cardNumber,
        cardHolder,
        expiry,
        brand,
        paypalEmail,
        isDefault,
        userId,
      },
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
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId },
    });
    res.json(paymentMethods);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update Payment Method
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type,
      cardNumber,
      cardHolder,
      expiry,
      brand,
      paypalEmail,
      isDefault,
    } = req.body;
    const paymentMethod = await prisma.paymentMethod.update({
      where: { id: parseInt(id) },
      data: {
        type,
        cardNumber,
        cardHolder,
        expiry,
        brand,
        paypalEmail,
        isDefault,
      },
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

// Create Stripe PaymentIntent
exports.createStripePaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'eur', payment_method_types = ['card'] } = req.body;
    if (!amount) return res.status(400).json({ error: 'Amount required' });
    
    // Stripe requires minimum amount (50 cents in smallest currency unit)
    // For EUR, minimum is 0.50 EUR
    const minAmount = 0.50;
    if (amount < minAmount) {
      return res.status(400).json({ 
        error: 'Amount too small', 
        message: `Minimum amount is ${minAmount} ${currency.toUpperCase()}` 
      });
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency: currency.toLowerCase(),
      payment_method_types,
      description: 'Restaurant order payment',
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Payment failed', details: err.message });
  }
};
