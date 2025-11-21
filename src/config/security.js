const helmet = require("helmet");
const cors = require("cors");

const buildFormActionSources = () => {
  const sources = ["'self'"];

  const baseUrl = process.env.EMAIL_LINK_BASE_URL;
  if (!baseUrl) {
    return sources;
  }

  try {
    const url = new URL(baseUrl);
    const origin = `${url.protocol}//${url.host}`;
    if (!sources.includes(origin)) {
      sources.push(origin);
    }

    if (url.protocol === "http:") {
      const httpsOrigin = `https://${url.host}`;
      if (!sources.includes(httpsOrigin)) {
        sources.push(httpsOrigin);
      }
    }
  } catch (error) {
    // Ignore parsing errors and fall back to the default self-origin only
  }

  return sources;
};

// Security configuration
const securityConfig = {
  // Helmet for security headers
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
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
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",")
        : ["http://localhost:3000", "http://localhost:19006"];

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
