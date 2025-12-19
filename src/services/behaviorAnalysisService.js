const { PrismaClient } = require("../generated/prisma");
const logger = require('../utils/logger');
const prisma = new PrismaClient();

class BehaviorAnalysisService {
  
  /**
   * Analyze user's order history and update their behavior profile
   * Called after each completed order
   */
  async updateUserProfile(userId) {
    try {
      // Check if user has consent
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { behaviorTrackingConsent: true }
      });
      
      if (!user || !user.behaviorTrackingConsent) {
        logger.info(`Skipping behavior analysis for user ${userId} - no consent`);
        return;
      }
      
      // Get last 90 days of delivered orders
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const orders = await prisma.order.findMany({
        where: {
          userId,
          status: 'delivered',
          createdAt: { gte: ninetyDaysAgo }
        },
        include: {
          items: {
            include: { menuItem: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      if (orders.length === 0) {
        return; // Not enough data
      }
      
      // Analyze most ordered items
      const itemCounts = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          const itemId = item.menuItemId;
          if (!itemCounts[itemId]) {
            itemCounts[itemId] = {
              menuItemId: itemId,
              name: item.menuItem.name,
              count: 0,
              lastOrdered: order.createdAt
            };
          }
          itemCounts[itemId].count += item.quantity;
          
          // Update last ordered date if more recent
          if (new Date(order.createdAt) > new Date(itemCounts[itemId].lastOrdered)) {
            itemCounts[itemId].lastOrdered = order.createdAt;
          }
        });
      });
      
      const mostOrderedItems = Object.values(itemCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 items
      
      // Analyze order times (hour and day of week)
      const timeFrequency = {};
      orders.forEach(order => {
        const date = new Date(order.createdAt);
        const hour = date.getHours();
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        const key = `${dayOfWeek}-${hour}`;
        
        if (!timeFrequency[key]) {
          timeFrequency[key] = { hour, dayOfWeek, count: 0 };
        }
        timeFrequency[key].count++;
      });
      
      const commonOrderTimes = Object.values(timeFrequency)
        .filter(t => t.count >= 2) // At least 2 orders at this time
        .sort((a, b) => b.count - a.count)
        .slice(0, 3); // Top 3 time slots
      
      // Calculate average order value
      const totalValue = orders.reduce((sum, order) => {
        const orderTotal = order.items.reduce((itemSum, item) => {
          return itemSum + (item.menuItem.price * item.quantity);
        }, 0);
        return sum + orderTotal;
      }, 0);
      const averageOrderValue = totalValue / orders.length;
      
      // Calculate order frequency (average days between orders)
      let orderFrequencyDays = null;
      if (orders.length >= 2) {
        const dates = orders.map(o => new Date(o.createdAt).getTime());
        const intervals = [];
        for (let i = 0; i < dates.length - 1; i++) {
          const daysDiff = (dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24);
          intervals.push(daysDiff);
        }
        orderFrequencyDays = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      }
      
      // Update or create behavior profile
      await prisma.behaviorProfile.upsert({
        where: { userId },
        create: {
          userId,
          mostOrderedItems,
          commonOrderTimes,
          averageOrderValue,
          lastOrderDate: orders[0].createdAt,
          orderFrequencyDays,
        },
        update: {
          mostOrderedItems,
          commonOrderTimes,
          averageOrderValue,
          lastOrderDate: orders[0].createdAt,
          orderFrequencyDays,
        }
      });
      
      logger.info(`Behavior profile updated for user ${userId}`, {
        orderCount: orders.length,
        topItems: mostOrderedItems.length,
        commonTimes: commonOrderTimes.length
      });
      
    } catch (err) {
      logger.error(`Failed to update behavior profile for user ${userId}:`, err);
    }
  }
  
  /**
   * Find users who might be interested in a reminder
   * Runs as a scheduled job (e.g., every hour)
   */
  async findUsersForReminders() {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDayOfWeek = now.getDay();
      
      // Find profiles with matching time patterns
      const profiles = await prisma.behaviorProfile.findMany({
        where: {
          user: {
            reminderNotificationsConsent: true,
          },
          remindersOptOut: false,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              pushToken: true,
              reminderNotificationsConsent: true,
            }
          }
        }
      });
      
      const candidates = [];
      
      for (const profile of profiles) {
        // Skip if reminder sent recently (within last 24 hours)
        if (profile.lastReminderSent) {
          const hoursSinceLastReminder = 
            (now - new Date(profile.lastReminderSent)) / (1000 * 60 * 60);
          if (hoursSinceLastReminder < 24) {
            continue;
          }
        }
        
        // Check if user typically orders at this time
        const commonOrderTimes = profile.commonOrderTimes || [];
        const hasMatchingTime = commonOrderTimes.some(time => 
          time.dayOfWeek === currentDayOfWeek && 
          Math.abs(time.hour - currentHour) <= 1 // Within 1 hour window
        );
        
        if (!hasMatchingTime) {
          continue;
        }
        
        // Check if user hasn't ordered recently
        const lastOrderDate = profile.lastOrderDate;
        if (lastOrderDate) {
          const daysSinceLastOrder = 
            (now - new Date(lastOrderDate)) / (1000 * 60 * 60 * 24);
          
          const expectedFrequency = profile.orderFrequencyDays || 7;
          
          // Only remind if it's been longer than expected
          if (daysSinceLastOrder < expectedFrequency * 0.8) {
            continue; // Too soon
          }
        }
        
        // User is a good candidate
        candidates.push({
          userId: profile.userId,
          profile,
          user: profile.user,
        });
      }
      
      return candidates;
      
    } catch (err) {
      logger.error("Error finding reminder candidates:", err);
      return [];
    }
  }
  
  /**
   * Send reminder notification to user
   */
  async sendReminder(userId, profile) {
    try {
      // Check if user still has push token
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushToken: true }
      });
      
      if (!user || !user.pushToken) {
        logger.info(`Skipping reminder for user ${userId} - no push token`);
        return;
      }
      
      // Get user's favorite item
      const mostOrderedItems = profile.mostOrderedItems || [];
      let favoriteItem = "your favorite meal";
      if (mostOrderedItems.length > 0) {
        favoriteItem = mostOrderedItems[0].name;
      }
      
      // Generate friendly reminder message
      const messages = [
        `Missing ${favoriteItem}? 🍕`,
        `Time for ${favoriteItem}? We're ready when you are! 😊`,
        `Hungry? ${favoriteItem} sounds good right now 🍔`,
        `Your usual ${favoriteItem} is calling your name! 📞`,
      ];
      
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      // Send notification using existing notification controller
      const { sendPushNotification } = require('../controllers/notificationsController');
      
      await sendPushNotification(
        user.pushToken,
        "Feeling hungry?",
        message,
        { type: 'behavior_reminder', userId }
      );
      
      // Update profile
      await prisma.behaviorProfile.update({
        where: { userId },
        data: {
          lastReminderSent: new Date(),
          remindersSent: { increment: 1 }
        }
      });
      
      // Log notification
      await prisma.notificationLog.create({
        data: {
          userId,
          type: 'reminder',
          templateId: 'behavior_based',
          title: "Feeling hungry?",
          message,
          delivered: true,
        }
      });
      
      logger.info(`Reminder sent to user ${userId}`);
      
    } catch (err) {
      logger.error(`Failed to send reminder to user ${userId}:`, err);
    }
  }
}

module.exports = new BehaviorAnalysisService();
