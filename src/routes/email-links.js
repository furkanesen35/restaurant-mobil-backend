const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../generated/prisma");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");

const prisma = new PrismaClient();

const sanitize = (value = "") =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const renderErrorPage = (title, message) => `
  <!DOCTYPE html>
  <html>
    <head>
      <title>${title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .error { color: #c62828; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="error">${title}</h1>
        <p>${message}</p>
      </div>
    </body>
  </html>
`;

router.get("/verify-email", (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res
      .status(400)
      .send(renderErrorPage("❌ Invalid Link", "Verification token is missing."));
  }

  const safeToken = sanitize(token);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Email Verification</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .status { font-size: 18px; margin-top: 20px; }
          .success { color: #2e7d32; }
          .error { color: #c62828; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎉 Verifying Your Email</h1>
          <p class="status" id="status">Please wait while we verify your email...</p>
        </div>
        <script>
          const token = ${JSON.stringify(token)};
          const statusEl = document.getElementById('status');

          fetch('/api/auth/verify-email?token=' + encodeURIComponent(token))
            .then(async (res) => {
              if (!res.ok) {
                const data = await res.json().catch(() => ({ message: 'Failed to verify email.' }));
                throw new Error(data.error || data.message || 'Failed to verify email.');
              }
              return res.json();
            })
            .then(() => {
              statusEl.textContent = '✅ Email verified successfully! You can close this page and return to the app.';
              statusEl.classList.add('success');
            })
            .catch((error) => {
              statusEl.textContent = error.message + ' Please return to the app and try again.';
              statusEl.classList.add('error');
            });
        </script>
      </body>
    </html>
  `;

  res.type("html").send(html);
});

const renderResetForm = (token, message = "", isError = false) => {
  const safeToken = sanitize(token);
  const messageHtml = message
    ? `<div class="message ${isError ? "error" : "success"}">${message}</div>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reset Password</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          form { display: flex; flex-direction: column; gap: 15px; }
          label { font-weight: bold; }
          input { padding: 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 16px; }
          button { background-color: #FF6B35; color: white; padding: 12px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; }
          button:hover { background-color: #e55b25; }
          .message { margin-top: 20px; font-size: 16px; text-align: center; }
          .success { color: #2e7d32; }
          .error { color: #c62828; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔐 Reset Your Password</h1>
          <p>Enter your new password below. This code expires in 1 hour.</p>
          <form method="POST" action="/reset-password">
            <input type="hidden" name="token" value="${safeToken}" />
            <div>
              <label for="password">New Password</label>
              <input type="password" id="password" name="password" placeholder="Enter new password" required minlength="6" />
            </div>
            <div>
              <label for="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm new password" required minlength="6" />
            </div>
            <button type="submit">Reset Password</button>
          </form>
          ${messageHtml}
        </div>
      </body>
    </html>
  `;
};

router.get("/reset-password", (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res
      .status(400)
      .send(renderErrorPage("❌ Invalid Link", "Reset token is missing."));
  }

  res.type("html").send(renderResetForm(token));
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token) {
      return res
        .status(400)
        .send(renderErrorPage("❌ Invalid Request", "Reset token is missing."));
    }

    if (!password || !confirmPassword) {
      return res
        .status(400)
        .send(renderResetForm(token, "Please enter and confirm your new password.", true));
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .send(renderResetForm(token, "Passwords do not match.", true));
    }

    if (password.length < 6) {
      return res
        .status(400)
        .send(renderResetForm(token, "Password must be at least 6 characters.", true));
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      return res
        .status(400)
        .send(renderErrorPage("❌ Invalid or Expired Token", "Please request a new password reset email."));
    }

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    logger.info("Password reset via web form", { userId: user.id, email: user.email });

    return res
      .status(200)
      .send(
        renderResetForm(
          token,
          "✅ Password reset successfully! You can now return to the app and log in with your new password.",
          false
        )
      );
  } catch (error) {
    logger.error("Password reset form error", { error: error.message });
    return res
      .status(500)
      .send(renderErrorPage("Server Error", "Something went wrong. Please try again."));
  }
});

module.exports = router;
