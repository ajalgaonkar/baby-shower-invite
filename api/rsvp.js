const { Redis } = require('@upstash/redis');
const nodemailer = require('nodemailer');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const NOTIFY_EMAIL = 'jalgaonkar_aditya@yahoo.com';
const RSVP_KEY = 'baby_shower_rsvps';

async function sendNotificationEmail(entry, isUpdate) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass }
  });

  const subject = isUpdate
    ? `Baby Shower RSVP Updated: ${entry.familyName}`
    : `New Baby Shower RSVP: ${entry.familyName}`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #FDF8F4; border-radius: 12px;">
      <h2 style="color: #C4956A; text-align: center; margin-bottom: 20px;">
        ${isUpdate ? 'RSVP Updated' : 'New RSVP Received!'}
      </h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; font-weight: bold; color: #4A3728;">Family Name:</td><td style="padding: 8px 0; color: #4A3728;">${entry.familyName}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold; color: #4A3728;">Adults:</td><td style="padding: 8px 0; color: #4A3728;">${entry.adults}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold; color: #4A3728;">Children:</td><td style="padding: 8px 0; color: #4A3728;">${entry.children}</td></tr>
        ${entry.message ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #4A3728;">Message:</td><td style="padding: 8px 0; color: #4A3728; font-style: italic;">"${entry.message}"</td></tr>` : ''}
      </table>
      <p style="color: #7A6455; margin-top: 20px; font-size: 0.9rem; text-align: center;">
        Total guests: ${entry.adults + entry.children}
      </p>
    </div>`;

  try {
    await transporter.sendMail({
      from: `"Baby Shower RSVP" <${gmailUser}>`,
      to: NOTIFY_EMAIL,
      subject,
      html
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { familyName, adults, children, message } = req.body;

  if (!familyName || !familyName.trim()) {
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

  const existing = rsvps.findIndex(
    r => r.familyName.toLowerCase() === familyName.trim().toLowerCase()
  );

  const entry = {
    familyName: familyName.trim(),
    adults: adultsNum,
    children: childrenNum,
    message: message ? message.trim() : '',
    submittedAt: new Date().toISOString()
  };

  const isUpdate = existing >= 0;
  if (isUpdate) {
    rsvps[existing] = entry;
  } else {
    rsvps.push(entry);
  }

  await redis.set(RSVP_KEY, rsvps);

  sendNotificationEmail(entry, isUpdate);

  res.json({ success: true, message: "RSVP received! We can't wait to see you!" });
};
