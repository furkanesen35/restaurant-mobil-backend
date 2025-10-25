const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

// Register push token
exports.registerPushToken = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Push token is required" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { pushToken: token },
    });

    res.json({ message: "Push token registered successfully" });
  } catch (err) {
    console.error("Register push token error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Send notification to user (helper function)
async function sendPushNotification(userId, title, body, data = {}) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true },
    });

    if (!user || !user.pushToken) {
      console.log(`No push token for user ${userId}`);
      return;
    }

    // Send to Expo push notification service
    const message = {
      to: user.pushToken,
      sound: "default",
      title,
      body,
      data,
    };

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log("Push notification sent:", result);
  } catch (err) {
    console.error("Error sending push notification:", err);
  }
}

// Send order status notification
exports.sendOrderStatusNotification = async (orderId, status) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) return;

    const statusMessages = {
      confirmed: "Your order has been confirmed!",
      preparing: "Your order is being prepared",
      ready: "Your order is ready for pickup/delivery",
      delivered: "Your order has been delivered. Enjoy!",
    };

    const message = statusMessages[status];
    if (message) {
      await sendPushNotification(
        order.userId,
        "Order Update",
        message,
        { orderId, status }
      );
    }
  } catch (err) {
    console.error("Error sending order notification:", err);
  }
};

module.exports = {
  registerPushToken: exports.registerPushToken,
  sendOrderStatusNotification: exports.sendOrderStatusNotification,
  sendPushNotification,
};
