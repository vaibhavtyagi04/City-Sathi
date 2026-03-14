const { TwitterApi } = require('twitter-api-v2');

// Only instantiate Twitter API if keys are available, otherwise we mock it
const isTwitterReady = Boolean(
    process.env.TWITTER_API_KEY && 
    process.env.TWITTER_API_SECRET && 
    process.env.TWITTER_ACCESS_TOKEN && 
    process.env.TWITTER_ACCESS_SECRET
);

let twitterClient = null;

if (isTwitterReady) {
    twitterClient = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET
    });
}

const postComplaintTweet = async (report) => {
    const categoryName = report.category ? report.category.replace('_', ' ').toUpperCase() : 'UNKNOWN';
    const locationStr = report.location?.address || 'City Area';
    
    const tweetMessage = `🚨 Civic Issue Reported

Category: ${categoryName}
Location: ${locationStr}
Priority: ${report.priority || 'Medium'}
Status: Pending

Track Issue:
${report.publicUrl}

#CitySathi #SmartCity`;

    if (!isTwitterReady) {
        console.log('[MOCK TWITTER] Auto-tweet generated (Keys missing in .env):', tweetMessage.replace(/\n/g, ' \\n '));
        return `mock-tweet-id-${Date.now()}`;
    }

    try {
        const response = await twitterClient.v2.tweet(tweetMessage);
        console.log('Tweet posted successfully:', response.data.id);
        return response.data.id;
    } catch (error) {
        console.error('Error posting tweet:', error);
        return null; // Don't crash report creation if tweet fails
    }
};

const postEscalationReply = async (tweetId, publicUrl) => {
    const replyMessage = `⚠️ Update: This issue has not been resolved for 72 hours.
Authorities are requested to take urgent action.

Track Issue:
${publicUrl}

#Accountability #SmartCity`;

    if (!isTwitterReady) {
        console.log('[MOCK TWITTER] Escalation reply generated for tweet:', tweetId);
        return true;
    }

    try {
        await twitterClient.v2.reply(replyMessage, tweetId);
        console.log('Escalation reply posted successfully.');
        return true;
    } catch (error) {
        console.error('Error posting escalation reply:', error);
        return false;
    }
};

module.exports = { postComplaintTweet, postEscalationReply };
