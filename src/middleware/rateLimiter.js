const rateLimit = require("express-rate-limit");

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes default
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests",
    message: "Too many requests from this IP, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Increased from 5 to 10 for better UX
  message: {
    error: "Too many authentication attempts",
    message: "Too many login attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many password reset attempts",
    message: "Please wait a few minutes before requesting another password reset email",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const verificationEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many verification attempts",
    message: "Please wait a few minutes before requesting another verification email",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  verificationEmailLimiter,
};
