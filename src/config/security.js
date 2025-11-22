const helmet = require("helmet");
const cors = require("cors");

const getEmailLinkOrigins = () => {
  const origins = [];
  const baseUrl = process.env.EMAIL_LINK_BASE_URL;

  if (!baseUrl) {
    return origins;
  }

  try {
    const url = new URL(baseUrl);
    const origin = `${url.protocol}//${url.host}`;
    origins.push(origin);

    if (url.protocol === "http:") {
      origins.push(`https://${url.host}`);
    }
  } catch (error) {
    // Ignore parsing errors and fall back to defaults
  }

  return origins;
};

const buildFormActionSources = () => {
  const sources = ["'self'"];
  getEmailLinkOrigins().forEach((origin) => {
    if (!sources.includes(origin)) {
      sources.push(origin);
    }
  });
  return sources;
};

const buildAllowedOrigins = () => {
  const defaults = ["http://localhost:3000", "http://localhost:19006"];
  const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

  const combined = [...defaults, ...envOrigins, ...getEmailLinkOrigins()];
  return Array.from(new Set(combined));
};

// Security configuration
const securityConfig = {
  // Helmet for security headers
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        formAction: buildFormActionSources(),
        upgradeInsecureRequests: null,
      },
    },
    crossOriginEmbedderPolicy: false,
  }),

  // CORS configuration
  cors: cors({
    origin: function (origin, callback) {
      // Allow requests with no origin header or explicit "null" origins (file://, same-origin forms)
      if (!origin || origin === "null") {
        return callback(null, true);
      }

      const allowedOrigins = buildAllowedOrigins();
      
      // Explicitly allow the public IP for mobile app access
      if (origin && origin.includes("40.67.194.111")) {
        return callback(null, true);
      }

      // Allow all local network IPs (192.168.x.x, 10.x.x.x, etc.) and localhost
      const isLocalNetwork =
        origin.match(
          /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/
        ) || origin.match(/^exp:\/\/192\.168\.\d+\.\d+(:\d+)?$/);

      if (allowedOrigins.indexOf(origin) !== -1 || isLocalNetwork) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  }),
};

module.exports = securityConfig;
