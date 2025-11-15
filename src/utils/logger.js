const LEVELS = ["silent", "error", "warn", "info", "debug"];
const parseLevel = (value) =>
  LEVELS.includes(String(value).toLowerCase())
    ? String(value).toLowerCase()
    : null;

const activeLevel =
  parseLevel(process.env.LOG_LEVEL) ||
  (process.env.NODE_ENV === "development" ? "debug" : "info");

const shouldLog = (level) =>
  LEVELS.indexOf(level) <= LEVELS.indexOf(activeLevel);

const timestamp = () => new Date().toISOString();

const logger = {
  info: (message, meta = {}) => {
    if (shouldLog("info")) {
      console.log(`[INFO] ${timestamp()}: ${message}`, meta);
    }
  },
  error: (message, error = {}) => {
    if (shouldLog("error")) {
      console.error(`[ERROR] ${timestamp()}: ${message}`, error);
    }
  },
  warn: (message, meta = {}) => {
    if (shouldLog("warn")) {
      console.warn(`[WARN] ${timestamp()}: ${message}`, meta);
    }
  },
  debug: (message, meta = {}) => {
    if (shouldLog("debug")) {
      console.debug(`[DEBUG] ${timestamp()}: ${message}`, meta);
    }
  },
};

module.exports = logger;
