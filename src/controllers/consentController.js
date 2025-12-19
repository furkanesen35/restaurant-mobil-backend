const { PrismaClient } = require("../generated/prisma");
const logger = require('../utils/logger');
const prisma = new PrismaClient();

exports.getConsent = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        marketingConsent: true,
        behaviorTrackingConsent: true,
        reminderNotificationsConsent: true,
        consentGivenAt: true,
        consentUpdatedAt: true,
      }
    });
    
    res.json(user);
  } catch (err) {
    logger.error("Get consent error:", err);
    res.status(500).json({ error: "Failed to get consent settings" });
  }
};

exports.updateConsent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      marketingConsent,
      behaviorTrackingConsent,
      reminderNotificationsConsent,
    } = req.body;
    
    const now = new Date();
    
    const updateData = {
      consentUpdatedAt: now,
    };
    
    // Only update provided fields
    if (typeof marketingConsent === 'boolean') {
      updateData.marketingConsent = marketingConsent;
    }
    if (typeof behaviorTrackingConsent === 'boolean') {
      updateData.behaviorTrackingConsent = behaviorTrackingConsent;
      
      // If tracking disabled, delete behavior profile
      if (!behaviorTrackingConsent) {
        await prisma.behaviorProfile.deleteMany({
          where: { userId }
        });
        logger.info(`Behavior profile deleted for user ${userId}`);
      }
    }
    if (typeof reminderNotificationsConsent === 'boolean') {
      updateData.reminderNotificationsConsent = reminderNotificationsConsent;
    }
    
    // Set consentGivenAt on first consent
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { consentGivenAt: true }
    });
    
    if (!user.consentGivenAt) {
      updateData.consentGivenAt = now;
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        marketingConsent: true,
        behaviorTrackingConsent: true,
        reminderNotificationsConsent: true,
        consentGivenAt: true,
        consentUpdatedAt: true,
      }
    });
    
    logger.info(`Consent updated for user ${userId}`, updateData);
    
    res.json({
      success: true,
      consent: updatedUser
    });
  } catch (err) {
    logger.error("Update consent error:", err);
    res.status(500).json({ error: "Failed to update consent" });
  }
};

exports.getPrivacyPolicy = async (req, res) => {
  // Return privacy policy text or link
  res.json({
    version: "1.0",
    lastUpdated: "2025-12-19",
    url: "https://yourrestaurant.com/privacy",
    summary: "We collect order data to improve your experience. You can opt out anytime."
  });
};
