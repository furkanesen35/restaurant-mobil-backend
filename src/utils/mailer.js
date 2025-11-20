const nodemailer = require("nodemailer");
const logger = require("./logger");

let cachedTransporter;

function createTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const { SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP credentials are not configured");
  }

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT, 10) || 465;
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE.toLowerCase() === "true"
    : port === 465;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return cachedTransporter;
}

async function sendMail({ to, subject, text, html }) {
  try {
    const transporter = createTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    logger.info("Email sent", { to, subject, messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error("Failed to send email", {
      error: error.message,
      to,
      subject,
    });
    throw error;
  }
}

module.exports = { sendMail };
