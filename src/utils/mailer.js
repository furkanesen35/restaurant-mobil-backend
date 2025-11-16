const logger = require("./logger");

/**
 * SMTP has been intentionally disabled for now to avoid external dependencies
 * during development. We log the intent instead of actually attempting to send
 * the email so downstream flows keep working without errors.
 */
async function sendMail({ to, subject, text, html }) {
  logger.warn("SMTP disabled - skipping email send", {
    to,
    subject,
    hasText: Boolean(text),
    hasHtml: Boolean(html),
  });

  return {
    accepted: [],
    rejected: [],
    messageId: null,
    disabled: true,
  };
}

module.exports = { sendMail };
