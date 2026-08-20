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

  const { originalFamilyName, familyName, adults, children, message } = req.body;

  if (!originalFamilyName || !familyName || !familyName.trim()) {
    return res.status(400).json({ error: 'Family name is required' });
  }

  const adultsNum = parseInt(adults, 10);
  const childrenNum = parseInt(children, 10);

  if (isNaN(adultsNum) || adultsNum < 1) {
    return res.status(400).json({ error: 'At least 1 adult is required' });
  }
  if (isNaN(childrenNum) || childrenNum < 0) {
    return res.status(400).json({ error: 'Children count must be 0 or more' });
  }

  const rsvps = (await redis.get(RSVP_KEY)) || [];
  const index = rsvps.findIndex(
    r => r.familyName.toLowerCase() === originalFamilyName.toLowerCase()
  );

  if (index === -1) {
    return res.status(404).json({ error: 'RSVP not found' });
  }

  rsvps[index] = {
    familyName: familyName.trim(),
    adults: adultsNum,
    children: childrenNum,
    message: message ? message.trim() : '',
    submittedAt: rsvps[index].submittedAt,
    editedAt: new Date().toISOString()
  };

  await redis.set(RSVP_KEY, rsvps);

  res.json({ success: true, message: 'RSVP updated' });
};
