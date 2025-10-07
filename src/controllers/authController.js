const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Helper function to generate JWT tokens
const generateTokens = (user) => {
  const payload = { userId: user.id, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
  return { accessToken, refreshToken };
};

// Helper function to sanitize user data
const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt
});

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, email, password } = req.body;
    
    logger.info('User registration attempt', { email });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      logger.warn('Registration failed - email already exists', { email });
      return res.status(409).json({ 
        error: 'Email already in use',
        message: 'An account with this email already exists'
      });
    }

    // Hash password with configurable rounds
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: { 
        name: name.trim(), 
        email: email.toLowerCase().trim(), 
        password: hashedPassword 
      }
    });

    logger.info('User registered successfully', { userId: user.id, email });

    res.status(201).json({ 
      message: 'User registered successfully',
      user: sanitizeUser(user)
    });
  } catch (err) {
    logger.error('Registration error', { error: err.message, email: req.body.email });
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;
    
    logger.info('Login attempt', { email });

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      logger.warn('Login failed - user not found', { email });
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn('Login failed - invalid password', { email, userId: user.id });
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    logger.info('User logged in successfully', { userId: user.id, email });

    res.json({ 
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: sanitizeUser(user)
    });
  } catch (err) {
    logger.error('Login error', { error: err.message, email: req.body.email });
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token required',
        message: 'Please provide a refresh token'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    // Find user
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    logger.info('Token refreshed successfully', { userId: user.id });

    res.json({
      message: 'Token refreshed successfully',
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: sanitizeUser(user)
    });
  } catch (err) {
    logger.error('Token refresh error', { error: err.message });
    next(err);
  }
};
