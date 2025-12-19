const { PrismaClient } = require("../generated/prisma");
const logger = require('../utils/logger');
const prisma = new PrismaClient();

// Predefined message templates for common situations
const MESSAGE_TEMPLATES = [
  {
    id: 'delay_traffic',
    title: 'Delivery Delayed',
    message: 'Your order is slightly delayed due to traffic. New ETA: {eta}. Thank you for your patience!',
    category: 'delay'
  },
  {
    id: 'delay_busy',
    title: 'Delivery Delayed',
    message: 'We are experiencing high demand. Your order will arrive in approximately {eta}. Sorry for the wait!',
    category: 'delay'
  },
  {
    id: 'driver_issue',
    title: 'Delivery Issue',
    message: 'Unfortunately, our delivery driver encountered an issue. We are arranging a new driver. Apologies for the inconvenience.',
    category: 'issue'
  },
  {
    id: 'refund_processing',
    title: 'Refund Processing',
    message: 'Your refund of €{amount} is being processed. It will appear in your account within 5-10 business days.',
    category: 'refund'
  },
  {
    id: 'refund_complete',
    title: 'Refund Complete',
    message: 'Your refund of €{amount} has been processed successfully. Thank you for your understanding.',
    category: 'refund'
  },
  {
    id: 'out_of_stock',
    title: 'Item Unavailable',
    message: 'Unfortunately, {item} is currently unavailable. We have removed it from your order and adjusted the total. Contact us for questions.',
    category: 'issue'
  },
  {
    id: 'custom',
    title: 'Message from Restaurant',
    message: '',
    category: 'custom'
  }
];

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
    logger.error("Register push token error:", err);
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
      logger.info(`No push token for user ${userId}`);
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
    logger.info("Push notification sent:", result);
  } catch (err) {
    logger.error("Error sending push notification:", err);
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
    logger.error("Error sending order notification:", err);
  }
};

// Send refund notification
exports.sendRefundNotification = async (orderId, refundAmount, refundStatus) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) return;

    let title, message;
    if (refundStatus === "succeeded") {
      title = "Refund Processed";
      message = `Your refund of €${refundAmount.toFixed(2)} for order #${orderId} has been processed successfully.`;
    } else if (refundStatus === "pending") {
      title = "Refund Initiated";
      message = `A refund of €${refundAmount.toFixed(2)} for order #${orderId} is being processed.`;
    } else {
      title = "Refund Update";
      message = `There was an issue processing your refund for order #${orderId}. Please contact support.`;
    }

    await sendPushNotification(
      order.userId,
      title,
      message,
      { orderId, refundAmount, refundStatus }
    );
  } catch (err) {
    logger.error("Error sending refund notification:", err);
  }
};

// Get templates
exports.getMessageTemplates = async (req, res) => {
  res.json(MESSAGE_TEMPLATES);
};

// Send custom admin message
exports.sendAdminMessage = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { 
      userId,      // Target user ID
      orderId,     // Optional: Link to specific order
      templateId,  // Optional: Use predefined template
      title,       // Custom title (if not using template)
      message,     // Custom message (if not using template)
      variables    // Template variables: { eta: "20 min", amount: "25.00" }
    } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    
    if (!templateId && (!title || !message)) {
      return res.status(400).json({ 
        error: "Either templateId or both title and message are required" 
      });
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, pushToken: true, email: true, name: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prepare notification content
    let notificationTitle = title;
    let notificationMessage = message;

    if (templateId) {
      const template = MESSAGE_TEMPLATES.find(t => t.id === templateId);
      if (!template) {
        return res.status(400).json({ error: "Invalid template ID" });
      }
      
      notificationTitle = template.title;
      notificationMessage = template.message;
      
      // Replace variables in template
      if (variables) {
        Object.keys(variables).forEach(key => {
          notificationMessage = notificationMessage.replace(
            `{${key}}`, 
            variables[key]
          );
        });
      }
    }

    // Send push notification
    let pushResult = null;
    if (targetUser.pushToken) {
      pushResult = await sendPushNotification(
        userId,
        notificationTitle,
        notificationMessage,
        { 
          orderId, 
          type: 'admin_message',
          templateId 
        }
      );
    }

    // Log the message
    logger.info("Admin message sent", {
      adminId,
      targetUserId: userId,
      orderId,
      title: notificationTitle,
      hasPushToken: !!targetUser.pushToken
    });

    res.json({
      success: true,
      message: "Notification sent successfully",
      delivered: !!targetUser.pushToken,
      notification: {
        title: notificationTitle,
        message: notificationMessage,
        sentTo: targetUser.email
      }
    });

  } catch (err) {
    logger.error("Send admin message error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

module.exports = {
  registerPushToken: exports.registerPushToken,
  sendOrderStatusNotification: exports.sendOrderStatusNotification,
  sendRefundNotification: exports.sendRefundNotification,
  sendPushNotification,
  getMessageTemplates: exports.getMessageTemplates,
  sendAdminMessage: exports.sendAdminMessage,
};
