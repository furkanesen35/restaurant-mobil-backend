const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authValidation } = require("../middleware/validation");
const { authenticate } = require("../middleware/auth");
const {
	authLimiter,
	passwordResetLimiter,
	verificationEmailLimiter,
} = require("../middleware/rateLimiter");

// NOTE: Removed global router.use(authLimiter) - it was too restrictive
// Each endpoint now has its own appropriate rate limit

// Register user (10 attempts per 15 min)
router.post(
	"/register",
	passwordResetLimiter, // More generous than authLimiter
	authValidation.register,
	authController.register
);

// Login user (5 attempts per 15 min)
router.post("/login", authLimiter, authValidation.login, authController.login);

// Google Sign-In

// Email verification
router.post(
	"/send-verification",
	verificationEmailLimiter,
	authController.sendVerificationEmail
);
router.get("/verify-email", authController.verifyEmail);

// Forgot/reset password
router.post(
	"/forgot-password",
	passwordResetLimiter,
	authController.forgotPassword
);
router.post("/reset-password", authController.resetPassword);

// Google Sign-In
router.post("/google", authController.googleSignIn);

// Refresh token endpoint (if needed)
router.post("/refresh", authController.refreshToken);

// Get current user (validates token)
router.get("/me", authenticate, authController.getCurrentUser);

// Update user profile
router.put("/profile", authenticate, authController.updateProfile);

// Delete user account
router.delete("/account", authenticate, authController.deleteAccount);

module.exports = router;
