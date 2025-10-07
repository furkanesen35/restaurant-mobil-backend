// Sanitize user input to prevent XSS attacks
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remove HTML tags and dangerous characters
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }
  
  return input;
};

// Middleware to sanitize request body
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeInput(req.body);
  }
  next();
};

// Middleware to sanitize query parameters
const sanitizeQuery = (req, res, next) => {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeInput(req.query);
  }
  next();
};

// Middleware to sanitize URL parameters
const sanitizeParams = (req, res, next) => {
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeInput(req.params);
  }
  next();
};

// SQL injection prevention patterns
const sqlInjectionPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
  /(\b(UNION|OR|AND)\b.*[=<>])/i,
  /(--|\/\*|\*\/)/,
  /(['";])/
];

// Check for SQL injection attempts
const detectSQLInjection = (value) => {
  if (typeof value !== 'string') return false;
  
  return sqlInjectionPatterns.some(pattern => pattern.test(value));
};

// Middleware to detect and prevent SQL injection
const preventSQLInjection = (req, res, next) => {
  const checkObject = (obj, path = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string' && detectSQLInjection(value)) {
        return res.status(400).json({
          error: 'Invalid input detected',
          message: 'Request contains potentially harmful content',
          field: currentPath
        });
      }
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const result = checkObject(value, currentPath);
        if (result) return result;
      }
    }
    return null;
  };

  // Check body
  if (req.body && typeof req.body === 'object') {
    const result = checkObject(req.body);
    if (result) return result;
  }

  // Check query
  if (req.query && typeof req.query === 'object') {
    const result = checkObject(req.query);
    if (result) return result;
  }

  // Check params
  if (req.params && typeof req.params === 'object') {
    const result = checkObject(req.params);
    if (result) return result;
  }

  next();
};

module.exports = {
  sanitizeInput,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  preventSQLInjection
};