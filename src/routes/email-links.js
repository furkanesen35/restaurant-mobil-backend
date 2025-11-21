const express = require("express");
const router = express.Router();

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
          .token { background-color: #e8f5e9; border: 2px dashed #4CAF50; padding: 20px; border-radius: 5px; margin: 20px 0; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎉 Verifying Your Email</h1>
          <p class="status" id="status">Please wait while we verify your email...</p>
          <div class="token" id="token-box" style="display:none;">
            <div id="token">${safeToken}</div>
          </div>
        </div>
        <script>
          const token = ${JSON.stringify(token)};
          const statusEl = document.getElementById('status');
          const tokenBox = document.getElementById('token-box');

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
              statusEl.textContent = error.message + ' Please copy the token below and verify inside the app.';
              statusEl.classList.add('error');
              tokenBox.style.display = 'block';
            });
        </script>
      </body>
    </html>
  `;

  res.type("html").send(html);
});

router.get("/reset-password", (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res
      .status(400)
      .send(renderErrorPage("❌ Invalid Link", "Reset token is missing."));
  }

  const safeToken = sanitize(token);

  const html = `
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
          .token { background-color: #fff3e0; border: 2px dashed #FF6B35; padding: 20px; border-radius: 5px; margin: 20px 0; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔐 Reset Your Password</h1>
          <p>Enter your new password below. This code expires in 1 hour.</p>
          <form id="reset-form">
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
          <div class="message" id="message"></div>
          <div class="token" id="token-box" style="display:none;">
            <div id="token">${safeToken}</div>
          </div>
        </div>
        <script>
          const form = document.getElementById('reset-form');
          const message = document.getElementById('message');
          const tokenBox = document.getElementById('token-box');
          const apiToken = ${JSON.stringify(token)};

          form.addEventListener('submit', async (event) => {
            event.preventDefault();
            message.textContent = 'Processing...';
            message.className = 'message';

            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
              message.textContent = 'Passwords do not match.';
              message.classList.add('error');
              return;
            }

            try {
              const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: apiToken, newPassword: password })
              });

              if (!response.ok) {
                const data = await response.json().catch(() => ({ message: 'Failed to reset password.' }));
                throw new Error(data.error || data.message || 'Failed to reset password.');
              }

              message.textContent = '✅ Password reset successfully! You can now return to the app and log in with your new password.';
              message.classList.add('success');
              form.reset();
            } catch (error) {
              message.textContent = error.message + ' If the issue persists, copy the code below and try resetting inside the app.';
              message.classList.add('error');
              tokenBox.style.display = 'block';
            }
          });
        </script>
      </body>
    </html>
  `;

  res.type("html").send(html);
});

module.exports = router;
