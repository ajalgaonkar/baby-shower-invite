const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const RSVP_KEY = 'baby_shower_rsvps';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { familyName } = req.body;

  if (!familyName) {
    return res.status(400).json({ error: 'Family name is required' });
  }

  const rsvps = (await redis.get(RSVP_KEY)) || [];
  const index = rsvps.findIndex(
    r => r.familyName.toLowerCase() === familyName.toLowerCase()
  );

  if (index === -1) {
    return res.status(404).json({ error: 'RSVP not found' });
  }

  rsvps.splice(index, 1);
  await redis.set(RSVP_KEY, rsvps);

  res.json({ success: true, message: 'RSVP deleted' });
};
