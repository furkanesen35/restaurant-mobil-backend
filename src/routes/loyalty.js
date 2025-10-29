const express = require('express');
const router = express.Router();
const loyaltyController = require('../controllers/loyaltyController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Rate limiting for redemptions (max 5 per hour per user)
const rateLimit = require('express-rate-limit');

const redemptionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 requests per hour
  message: {
    success: false,
    error: 'Rate limit exceeded',
    message: 'Zu viele Einlöseversuche. Bitte versuchen Sie es später erneut.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId || req.ip
});

// Admin routes - Create and manage tokens
router.post('/tokens', authenticate, requireAdmin, loyaltyController.createToken);
router.get('/tokens', authenticate, requireAdmin, loyaltyController.listTokens);
router.get('/tokens/:tokenId', authenticate, requireAdmin, loyaltyController.getToken);
router.delete('/tokens/:tokenId', authenticate, requireAdmin, loyaltyController.deactivateToken);

// User routes - Redeem tokens
router.post('/redeem', authenticate, redemptionLimiter, loyaltyController.redeemToken);

module.exports = router;
