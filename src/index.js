
require('dotenv').config();
const express = require('express');
const app = express();

// Import middleware and config
const securityConfig = require('./config/security');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler, requestLogger } = require('./middleware/errorHandler');
const { sanitizeBody, sanitizeQuery, sanitizeParams, preventSQLInjection } = require('./middleware/sanitization');
const logger = require('./utils/logger');

// Security middleware
app.use(securityConfig.helmet);
app.use(securityConfig.cors);

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/auth/', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization and security
app.use(sanitizeBody);
app.use(sanitizeQuery);
app.use(sanitizeParams);
app.use(preventSQLInjection);

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
const menuRoutes = require('./routes/menu');
app.use('/api/menu', menuRoutes);

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const orderRoutes = require('./routes/order');
app.use('/api/order', orderRoutes);

// Legacy routes for backward compatibility
app.use('/menu', menuRoutes);
app.use('/auth', authRoutes);
app.use('/order', orderRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Restaurant Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      menu: '/api/menu', 
      orders: '/api/order',
      health: '/health'
    }
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});
