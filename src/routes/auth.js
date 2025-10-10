const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authValidation } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to all auth routes
// router.use(authLimiter); // [TEMPORARY] Rate limiting disabled for development. REMEMBER TO RE-ENABLE BEFORE PRODUCTION!

// Register user
router.post('/register', authValidation.register, authController.register);

// Login user
router.post('/login', authValidation.login, authController.login);

// Google Sign-In
router.post('/google', authController.googleSignIn);

// Refresh token endpoint (if needed)
router.post('/refresh', authController.refreshToken);

module.exports = router;
