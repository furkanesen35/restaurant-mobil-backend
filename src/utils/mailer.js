const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

async function sendMail({ to, subject, text, html }) {
  return Promise.race([
    transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    }),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email timeout')), 15000)
    )
  ]);
}

module.exports = { sendMail };
