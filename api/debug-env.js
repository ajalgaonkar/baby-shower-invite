module.exports = function handler(req, res) {
  res.json({
    hasRedisUrl: !!process.env.UPSTASH_REDIS_REST_URL,
    hasRedisToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    hasGmailUser: !!process.env.GMAIL_USER,
    hasGmailPass: !!process.env.GMAIL_APP_PASSWORD,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  });
};
