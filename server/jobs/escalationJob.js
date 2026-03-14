const cron = require('node-cron');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { postEscalationReply } = require('../services/twitterService');

// Run every hour at the top of the hour
const checkEscalations = async () => {
    console.log('[JOBS] Running Escalation Check...');
    try {
        const now = Date.now();
        const ONE_HOUR = 60 * 60 * 1000;
        const H24 = 24 * ONE_HOUR;
        const H48 = 48 * ONE_HOUR;
        const H72 = 72 * ONE_HOUR;

        const activeReports = await Report.find({
            status: { $nin: ['resolved', 'rejected', 'completed', 'closed'] }
        });

        for (const report of activeReports) {
            const age = now - new Date(report.timestamp).getTime();

            // 72 Hours -> Level 3: Public Twitter Escalation
            if (age >= H72 && report.escalationLevel < 3) {
                report.escalationLevel = 3;
                if (report.tweetId && report.publicUrl) {
                    await postEscalationReply(report.tweetId, report.publicUrl);
                }
                await report.save();
                console.log(`[ESCALATION] Report ${report._id} escalated to Level 3 (Public Twitter).`);
            } 
            // 48 Hours -> Level 2: Admin Alert
            else if (age >= H48 && report.escalationLevel < 2) {
                report.escalationLevel = 2;
                await report.save();
                
                // Alert Admins
                const admins = await User.find({ role: 'admin' });
                const notifications = admins.map(admin => ({
                    userId: admin._id,
                    message: `⚠️ ESCALATION: Report regarding '${report.category.replace('_', ' ')}' has been pending for over 48 hours.`,
                    reportId: report._id
                }));
                if(notifications.length > 0) {
                    await Notification.insertMany(notifications);
                }
                console.log(`[ESCALATION] Report ${report._id} escalated to Level 2 (Admin Alert).`);
            }
            // 24 Hours -> Level 1: Reminder
            else if (age >= H24 && report.escalationLevel < 1) {
                report.escalationLevel = 1;
                await report.save();

                // Notify User
                const notification = new Notification({
                    userId: report.userId,
                    message: `Reminder: Your report for '${report.category.replace('_', ' ')}' is pending. Action will be taken soon.`,
                    reportId: report._id
                });
                await notification.save();
                console.log(`[ESCALATION] Report ${report._id} escalated to Level 1 (Reminder).`);
            }
        }
    } catch (error) {
        console.error('[JOBS] Error running escalation check:', error);
    }
};

const startEscalationJob = () => {
    cron.schedule('0 * * * *', checkEscalations);
    console.log('[JOBS] Escalation job scheduled to run hourly.');
};

module.exports = { startEscalationJob, checkEscalations };
