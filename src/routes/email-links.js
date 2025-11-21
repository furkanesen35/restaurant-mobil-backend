const express = require("express");
const router = express.Router();

// Email verification landing page
router.get("/verify-email", (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .error { color: #d32f2f; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">❌ Invalid Link</h1>
          <p>This verification link is missing required information.</p>
        </div>
      </body>
      </html>
    `);
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Email Verification</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .token { background-color: #e8f5e9; border: 2px dashed #4CAF50; padding: 20px; border-radius: 5px; margin: 20px 0; word-break: break-all; }
        .token-code { font-size: 18px; font-weight: bold; color: #4CAF50; letter-spacing: 2px; }
        .copy-btn { background-color: #4CAF50; color: white; padding: 12px 24px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; margin-top: 10px; }
        .copy-btn:hover { background-color: #45a049; }
        .success { color: #4CAF50; margin-top: 10px; display: none; }
        .instructions { color: #666; margin-top: 20px; text-align: left; }
        .instructions ol { padding-left: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎉 Verify Your Email</h1>
        <p>Copy the verification code below and paste it in the Restaurant App:</p>
        <div class="token">
          <div class="token-code" id="token">${token}</div>
        </div>
        <button class="copy-btn" onclick="copyToken()">📋 Copy Code</button>
        <div class="success" id="success">✅ Code copied to clipboard!</div>
        <div class="instructions">
          <h3>Instructions:</h3>
          <ol>
            <li>Open the Restaurant Mobile App</li>
            <li>Go to the verification screen</li>
            <li>Paste this code</li>
            <li>Tap "Verify Email"</li>
          </ol>
        </div>
      </div>
      <script>
        function copyToken() {
          const token = document.getElementById('token').textContent;
          navigator.clipboard.writeText(token).then(() => {
            document.getElementById('success').style.display = 'block';
            setTimeout(() => {
              document.getElementById('success').style.display = 'none';
            }, 3000);
          });
        }
      </script>
    </body>
    </html>
  `);
});

// Password reset landing page
router.get("/reset-password", (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reset Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .error { color: #d32f2f; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">❌ Invalid Link</h1>
          <p>This reset link is missing required information.</p>
        </div>
      </body>
      </html>
    `);
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reset Password</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .token { background-color: #fff3e0; border: 2px dashed #FF6B35; padding: 20px; border-radius: 5px; margin: 20px 0; word-break: break-all; }
        .token-code { font-size: 18px; font-weight: bold; color: #FF6B35; letter-spacing: 2px; }
        .copy-btn { background-color: #FF6B35; color: white; padding: 12px 24px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; margin-top: 10px; }
        .copy-btn:hover { background-color: #e55b25; }
        .success { color: #4CAF50; margin-top: 10px; display: none; }
        .instructions { color: #666; margin-top: 20px; text-align: left; }
        .instructions ol { padding-left: 20px; }
        .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin-top: 20px; color: #856404; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔐 Reset Your Password</h1>
        <p>Copy the reset code below and paste it in the Restaurant App:</p>
        <div class="token">
          <div class="token-code" id="token">${token}</div>
        </div>
        <button class="copy-btn" onclick="copyToken()">📋 Copy Code</button>
        <div class="success" id="success">✅ Code copied to clipboard!</div>
        <div class="instructions">
          <h3>Instructions:</h3>
          <ol>
            <li>Open the Restaurant Mobile App</li>
            <li>Go to the password reset screen</li>
            <li>Paste this code</li>
            <li>Enter your new password</li>
            <li>Tap "Reset Password"</li>
          </ol>
        </div>
        <div class="warning">
          ⏰ This code expires in 1 hour
        </div>
      </div>
      <script>
        function copyToken() {
          const token = document.getElementById('token').textContent;
          navigator.clipboard.writeText(token).then(() => {
            document.getElementById('success').style.display = 'block';
            setTimeout(() => {
              document.getElementById('success').style.display = 'none';
            }, 3000);
          });
        }
      </script>
    </body>
    </html>
  `);
});

module.exports = router;
