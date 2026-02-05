const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const logger = require("../utils/logger");
const crypto = require("crypto");
const { sendMail } = require("../utils/mailer");

const trimTrailingSlash = (value = "") => value.replace(/\/$/, "");
const isHttpUrl = (value) => typeof value === "string" && /^https?:\/\//i.test(value);

const resolveEmailBaseUrl = (req) => {
  const {
    EMAIL_LINK_BASE_URL,
    FRONTEND_URL,
    PUBLIC_EMAIL_BASE_URL,
  } = process.env;

  if (isHttpUrl(EMAIL_LINK_BASE_URL)) {
    return trimTrailingSlash(EMAIL_LINK_BASE_URL);
  }

  if (isHttpUrl(PUBLIC_EMAIL_BASE_URL)) {
    return trimTrailingSlash(PUBLIC_EMAIL_BASE_URL);
  }

  if (isHttpUrl(FRONTEND_URL)) {
    return trimTrailingSlash(FRONTEND_URL);
  }

  const origin = req.get("origin");
  if (isHttpUrl(origin)) {
    return trimTrailingSlash(origin);
  }

  const forwardedProto = req.get("x-forwarded-proto");
  const protocol = forwardedProto
    ? forwardedProto.split(",")[0].trim()
    : req.secure
      ? "https"
      : "http";
  const host = req.get("host") || "localhost:3000";

  return `${protocol}://${host}`.replace(/\/$/, "");
};

const buildEmailLink = (req, path, params = {}) => {
  const baseUrl = resolveEmailBaseUrl(req);
  const normalizedPath = path?.startsWith("/") ? path : `/${path || ""}`;
  const url = new URL(`${baseUrl}${normalizedPath}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
};

const buildVerificationEmailHtml = (token, verifyUrl) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #333; text-align: center; margin-bottom: 20px;">🎉 Welcome to Restaurant App!</h2>
      <p style="color: #666; font-size: 16px; line-height: 1.6; text-align: center;">Thank you for creating an account!</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold; display: inline-block;">Verify Email</a>
      </div>
      <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="color: #333; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">📱 How to verify your email:</p>
        <ol style="color: #666; font-size: 14px; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Tap the button above</li>
          <li>Open the app and continue using your account</li>
        </ol>
      </div>
      <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">If you didn't create an account, please ignore this email.</p>
    </div>
  </div>
`;

const buildPasswordResetEmailHtml = (token, resetUrl) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Password Reset Request</h2>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">You requested to reset your password for your Restaurant App account.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #FF6B35; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="color: #333; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">📱 How to reset your password:</p>
        <ol style="color: #666; font-size: 14px; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Click the button above</li>
          <li>Enter and confirm your new password</li>
        </ol>
      </div>
      <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">⏰ This code expires in 1 hour</p>
      <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
    </div>
  </div>
`;
// Email verification
exports.sendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { email },
      data: { verificationToken: token },
    });
    const verifyUrl = buildEmailLink(req, "/verify-email", { token });
    await sendMail({
      to: email,
      subject: "Verify Your Email - Restaurant App",
      text: `Your verification code is ${token}. You can also verify via ${verifyUrl}`,
      html: buildVerificationEmailHtml(token, verifyUrl),
    });

    res.json({ message: "Verification email sent", token });
  } catch (err) {
    logger.error("Send verification email error", { error: err.message });
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: null, isVerified: true },
    });
    res.json({ message: "Email verified successfully" });
  } catch (err) {
    logger.error("Verify email error", { error: err.message });
    next(err);
  }
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenExpiry: new Date(Date.now() + 3600 * 1000),
      },
    });
    const resetUrl = buildEmailLink(req, "/reset-password", { token });
    await sendMail({
      to: email,
      subject: "Password Reset - Restaurant App",
      text: `Use code ${token} to reset your password or visit ${resetUrl}`,
      html: buildPasswordResetEmailHtml(token, resetUrl),
    });

    res.json({ message: "Password reset email sent", token });
  } catch (err) {
    logger.error("Forgot password error", { error: err.message });
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    });
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    res.json({ message: "Password reset successful" });
  } catch (err) {
    logger.error("Reset password error", { error: err.message });
    next(err);
  }
};

// Helper function to generate JWT tokens
const generateTokens = (user) => {
  const payload = { userId: user.id, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
  return { accessToken, refreshToken };
};

// Helper function to sanitize user data
const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  loyaltyPoints: user.loyaltyPoints ?? 0,
});

// Google Sign-In
exports.googleSignIn = async (req, res, next) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    logger.info("Google sign-in attempt", { email });

    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user for Google sign-in
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          password: "", // No password for Google users
          role: "user",
        },
      });
      logger.info("New user created via Google sign-in", {
        userId: user.id,
        email,
      });
    } else {
      logger.info("Existing user signed in via Google", {
        userId: user.id,
        email,
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    res.status(200).json({
      message: "Google sign-in successful",
      token: accessToken,
      refreshToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    logger.error("Google sign-in error", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { email, password } = req.body;

    logger.info("User registration attempt", { email });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      logger.warn("Registration failed - email already exists", { email });
      return res.status(409).json({
        error: "Email already in use",
        message: "An account with this email already exists",
      });
    }

    // Hash password with configurable rounds
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate username from email
    const username = email.split("@")[0];

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create user
    const user = await prisma.user.create({
      data: {
        name: username,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        verificationToken: verificationToken,
      },
    });

    logger.info("User registered successfully", { userId: user.id, email });

    // Send verification email
    try {
      const verifyUrl = buildEmailLink(req, "/verify-email", {
        token: verificationToken,
      });
      await sendMail({
        to: email,
        subject: "Verify Your Email - Restaurant App",
        text: `Your verification code is ${verificationToken}. You can also verify via ${verifyUrl}`,
        html: buildVerificationEmailHtml(verificationToken, verifyUrl),
      });
      logger.info("Verification email sent", { email });
    } catch (emailErr) {
      logger.error("Failed to send verification email", {
        error: emailErr.message,
        email,
      });
      // Don't fail registration if email fails
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    res.status(201).json({
      message:
        "User registered successfully. Please check your email to verify your account.",
      token: accessToken,
      refreshToken,
      user: sanitizeUser(user),
    });
  } catch (err) {
    logger.error("Registration error", {
      error: err.message,
      email: req.body.email,
    });
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { email, password } = req.body;

    logger.info("Login attempt", { email });

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) {
      logger.warn("Login failed - user not found", { email });
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn("Login failed - invalid password", {
        email,
        userId: user.id,
      });
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    logger.info("User logged in successfully", { userId: user.id, email });

    res.json({
      message: "Login successful",
      token: accessToken,
      refreshToken,
      user: sanitizeUser(user),
    });
  } catch (err) {
    logger.error("Login error", { error: err.message, email: req.body.email });
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: "Refresh token required",
        message: "Please provide a refresh token",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user) {
      return res.status(401).json({
        error: "Invalid token",
        message: "User not found",
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    logger.info("Token refreshed successfully", { userId: user.id });

    res.json({
      message: "Token refreshed successfully",
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: sanitizeUser(user),
    });
  } catch (err) {
    logger.error("Token refresh error", { error: err.message });
    next(err);
  }
};

// Get current user (validates token and returns user info)
exports.getCurrentUser = async (req, res, next) => {
  try {
    const userRecord = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        loyaltyPoints: true,
        createdAt: true,
      },
    });

    if (!userRecord) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      ...userRecord,
      isEmailVerified: userRecord.isVerified,
    });
  } catch (err) {
    logger.error("Get current user error", { error: err.message });
    next(err);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Name is required and cannot be empty",
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Name cannot exceed 100 characters",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name: trimmedName },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        loyaltyPoints: true,
        createdAt: true,
      },
    });

    logger.info("User profile updated", { userId, name: trimmedName });

    res.json({
      message: "Profile updated successfully",
      user: {
        ...updatedUser,
        isEmailVerified: updatedUser.isVerified,
      },
    });
  } catch (err) {
    logger.error("Update profile error", { error: err.message });
    next(err);
  }
};

// Delete user account
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    logger.info("Account deletion requested", { userId });

    // Start a transaction to ensure all deletions happen atomically
    await prisma.$transaction(async (tx) => {
      // 1. Delete or nullify visit tokens created by the user
      await tx.visitToken.updateMany({
        where: { createdById: userId },
        data: { createdById: null },
      });

      // 2. Nullify redeemed tokens (keep the token but remove user reference)
      await tx.visitToken.updateMany({
        where: { redeemedById: userId },
        data: { redeemedById: null },
      });

      // 3. Delete payment methods (not cascaded)
      await tx.paymentMethod.deleteMany({
        where: { userId },
      });

      // 4. Anonymize orders (important for business records and accounting)
      // Keep the orders but remove personal information
      const orders = await tx.order.findMany({
        where: { userId },
        select: { id: true },
      });

      if (orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        // Update orders to mark them as anonymized
        await tx.order.updateMany({
          where: { id: { in: orderIds } },
          data: {
            userId: null, // Remove user reference
          },
        });
      }

      // 5. Delete items with cascade (will auto-delete):
      // - addresses (onDelete: Cascade)
      // - favorites (onDelete: Cascade)
      // - cartItems (onDelete: Cascade)
      // - behaviorProfile (onDelete: Cascade)
      // - notificationLogs (onDelete: Cascade)

      // 6. Finally, delete the user account
      await tx.user.delete({
        where: { id: userId },
      });

      logger.info("Account successfully deleted", { userId });
    });

    res.json({
      message: "Account deleted successfully",
      success: true,
    });
  } catch (err) {
    logger.error("Delete account error", { error: err.message, stack: err.stack });
    next(err);
  }
};
