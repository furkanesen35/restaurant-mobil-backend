const { body, param, query } = require('express-validator');

// Auth validation rules
const authValidation = {
  register: [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  
  login: [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ]
};

// Order validation rules
const orderValidation = {
  create: [
    body('userId')
      .optional()
      .custom((value) => {
        if (value && (!Number.isInteger(parseInt(value)) || parseInt(value) < 1)) {
          throw new Error('Valid user ID is required');
        }
        return true;
      }),
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('items.*.menuItemId')
      .custom((value) => {
        // Accept both string and integer IDs
        const parsed = parseInt(value);
        if (isNaN(parsed) || parsed < 1) {
          throw new Error('Valid menu item ID is required');
        }
        return true;
      }),
    body('items.*.quantity')
      .optional()
      .custom((value) => {
        if (value !== undefined) {
          const parsed = parseInt(value);
          if (isNaN(parsed) || parsed < 1 || parsed > 20) {
            throw new Error('Quantity must be between 1 and 20');
          }
        }
        return true;
      })
  ],
  
  updateStatus: [
    param('orderId')
      .isInt({ min: 1 })
      .withMessage('Valid order ID is required'),
    body('status')
      .isIn(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
      .withMessage('Invalid status value')
  ]
};

// Menu validation rules
const menuValidation = {
  getItem: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Valid menu item ID is required')
  ]
};

// Generic validation rules
const genericValidation = {
  paginationQuery: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]
};

module.exports = {
  authValidation,
  orderValidation,
  menuValidation,
  genericValidation
};