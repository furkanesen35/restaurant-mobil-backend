const cron = require('node-cron');
const behaviorAnalysisService = require('../services/behaviorAnalysisService');
const logger = require('../utils/logger');

// Run every hour
const scheduleReminderJob = () => {
  cron.schedule('0 * * * *', async () => {
    logger.info('Running reminder job...');
    
    try {
      const candidates = await behaviorAnalysisService.findUsersForReminders();
      
      logger.info(`Found ${candidates.length} users for reminders`);
      
      for (const candidate of candidates) {
        await behaviorAnalysisService.sendReminder(
          candidate.userId,
          candidate.profile
        );
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      logger.info('Reminder job completed');
    } catch (err) {
      logger.error('Reminder job failed:', err);
    }
  });
  
  logger.info('Reminder job scheduled (runs every hour)');
};

module.exports = { scheduleReminderJob };
