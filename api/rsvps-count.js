const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const RSVP_KEY = 'baby_shower_rsvps';

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rsvps = (await redis.get(RSVP_KEY)) || [];
  const totalFamilies = rsvps.length;
  const totalAdults = rsvps.reduce((sum, r) => sum + r.adults, 0);
  const totalChildren = rsvps.reduce((sum, r) => sum + r.children, 0);

  res.json({ totalFamilies, totalAdults, totalChildren });
};
