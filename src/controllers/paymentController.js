const { PrismaClient } = require("../generated/prisma");
const logger = require('../utils/logger');
const prisma = new PrismaClient();
const Stripe = require("stripe");
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
      saveToProfile = true,
      stripePaymentMethodId, // Stripe payment method ID for reuse
    } = req.body;
    const userId = req.user.userId;
    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        type,
        cardNumber, // Should be last 4 digits only
        cardHolder,
        expiry,
        brand,
        paypalEmail,
        stripePaymentMethodId, // Store Stripe PM ID
        isDefault,
        temporary: !saveToProfile, // Mark as temporary if not saving to profile
        userId,
      },
    });
    res.status(201).json(paymentMethod);
  } catch (err) {
    logger.error("Create payment method error:", err);
    res.status(400).json({ error: err.message });
  }
};

// Get all payment methods for user
exports.getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Only return non-temporary payment methods (saved to profile)
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        userId,
        temporary: false, // Only get saved payment methods
      },
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
    const userId = req.user.userId;
    const {
      type,
      cardNumber,
      cardHolder,
      expiry,
      brand,
      paypalEmail,
      isDefault,
    } = req.body;

    // Verify ownership of the payment method
    const existingMethod = await prisma.paymentMethod.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!existingMethod) {
      return res.status(404).json({ error: "Payment method not found" });
    }

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
    const userId = req.user.userId;

    // Verify ownership of the payment method
    const existingMethod = await prisma.paymentMethod.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!existingMethod) {
      return res.status(404).json({ error: "Payment method not found" });
    }

    await prisma.paymentMethod.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Create Stripe PaymentIntent
exports.createStripePaymentIntent = async (req, res) => {
  try {
    const {
      amount,
      currency = "eur",
      paymentMethodType = "card", // 'card' or 'paypal'
      orderId, // Optional: Link payment to an existing order
      savedPaymentMethodId, // ID of saved payment method from our database
    } = req.body;
    if (!amount) return res.status(400).json({ error: "Amount required" });

    // Stripe requires minimum amount (50 cents in smallest currency unit)
    // For EUR, minimum is 0.50 EUR
    const minAmount = 0.5;
    if (amount < minAmount) {
      return res.status(400).json({
        error: "Amount too small",
        message: `Minimum amount is ${minAmount} ${currency.toUpperCase()}`,
      });
    }

    const userId = req.user.userId;
    let stripePaymentMethodId = null;

    // If using a saved payment method, get the Stripe payment method ID
    if (savedPaymentMethodId) {
      const savedMethod = await prisma.paymentMethod.findFirst({
        where: {
          id: parseInt(savedPaymentMethodId),
          userId: userId,
          temporary: false,
        },
      });

      if (!savedMethod) {
        return res.status(404).json({ error: "Saved payment method not found" });
      }

      if (!savedMethod.stripePaymentMethodId) {
        return res.status(400).json({
          error: "Invalid saved payment method",
          message: "This payment method cannot be reused. Please add a new card.",
        });
      }

      stripePaymentMethodId = savedMethod.stripePaymentMethodId;
      logger.info("Using saved Stripe payment method:", stripePaymentMethodId);
    }

    // Determine payment method types based on paymentMethodType
    let payment_method_types = [];
    if (paymentMethodType === 'paypal') {
      payment_method_types = ['paypal'];
    } else {
      payment_method_types = ['card'];
    }

    // Create payment intent with or without saved payment method
    const paymentIntentData = {
      amount: Math.round(amount * 100), // Stripe expects cents
      currency: currency.toLowerCase(),
      description: "Restaurant order payment",
      metadata: {
        orderId: orderId ? String(orderId) : undefined,
      },
    };

    // If using saved payment method, attach it and set confirmation method
    if (stripePaymentMethodId) {
      paymentIntentData.payment_method = stripePaymentMethodId;
      paymentIntentData.confirm = true; // Auto-confirm with saved method
      paymentIntentData.off_session = true; // For saved cards
    } else {
      paymentIntentData.payment_method_types = payment_method_types;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    // If orderId is provided, update the order with paymentIntentId
    if (orderId) {
      await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: { paymentIntentId: paymentIntent.id },
      });
    }

    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status, // Include status for saved card payments
    });
  } catch (err) {
    logger.error("Stripe error:", err);
    res.status(500).json({ error: "Payment failed", details: err.message });
  }
};

// Link PaymentIntent to Order (called after order creation)
exports.linkPaymentToOrder = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;
    
    if (!orderId || !paymentIntentId) {
      return res.status(400).json({ error: "orderId and paymentIntentId required" });
    }

    const userId = req.user.userId;
    
    // Verify the order belongs to the user
    const order = await prisma.order.findFirst({
      where: { 
        id: parseInt(orderId),
        userId: userId,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Update order with paymentIntentId
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { paymentIntentId },
    });

    res.json({ 
      success: true, 
      message: "Payment linked to order",
      order: updatedOrder,
    });
  } catch (err) {
    logger.error("Link payment error:", err);
    res.status(500).json({ error: "Failed to link payment", details: err.message });
  }
};

