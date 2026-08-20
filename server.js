const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;
const RSVP_FILE = path.join(__dirname, 'rsvps.json');

const NOTIFY_EMAIL = 'jalgaonkar_aditya@yahoo.com';
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readRsvps() {
  if (!fs.existsSync(RSVP_FILE)) {
    fs.writeFileSync(RSVP_FILE, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(RSVP_FILE, 'utf8'));
}

function writeRsvps(rsvps) {
  fs.writeFileSync(RSVP_FILE, JSON.stringify(rsvps, null, 2));
}

async function sendNotificationEmail(entry, isUpdate) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.warn('Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD env vars.');
    return;
  }

  const subject = isUpdate
    ? `Baby Shower RSVP Updated: ${entry.familyName}`
    : `New Baby Shower RSVP: ${entry.familyName}`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #FDF8F4; border-radius: 12px;">
      <h2 style="color: #C4956A; text-align: center; margin-bottom: 20px;">
        ${isUpdate ? 'RSVP Updated' : 'New RSVP Received!'}
      </h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #4A3728;">Family Name:</td>
          <td style="padding: 8px 0; color: #4A3728;">${entry.familyName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #4A3728;">Adults:</td>
          <td style="padding: 8px 0; color: #4A3728;">${entry.adults}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #4A3728;">Children:</td>
          <td style="padding: 8px 0; color: #4A3728;">${entry.children}</td>
        </tr>
        ${entry.message ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #4A3728;">Message:</td>
          <td style="padding: 8px 0; color: #4A3728; font-style: italic;">"${entry.message}"</td>
        </tr>` : ''}
      </table>
      <p style="color: #7A6455; margin-top: 20px; font-size: 0.9rem; text-align: center;">
        Total guests: ${entry.adults + entry.children} (${entry.adults} adult${entry.adults > 1 ? 's' : ''}, ${entry.children} child${entry.children !== 1 ? 'ren' : ''})
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Baby Shower RSVP" <${GMAIL_USER}>`,
      to: NOTIFY_EMAIL,
      subject,
      html
    });
    console.log(`Notification email sent for: ${entry.familyName}`);
  } catch (err) {
    console.error('Failed to send email:', err.message);
  }
}

app.post('/api/rsvp', async (req, res) => {
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

  const rsvps = readRsvps();

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

  writeRsvps(rsvps);

  sendNotificationEmail(entry, isUpdate);

  res.json({ success: true, message: 'RSVP received! We can\'t wait to see you!' });
});

app.get('/api/rsvps/count', (req, res) => {
  const rsvps = readRsvps();
  const totalFamilies = rsvps.length;
  const totalAdults = rsvps.reduce((sum, r) => sum + r.adults, 0);
  const totalChildren = rsvps.reduce((sum, r) => sum + r.children, 0);
  res.json({ totalFamilies, totalAdults, totalChildren });
});

app.listen(PORT, () => {
  console.log(`Baby shower site running at http://localhost:${PORT}`);
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.warn('⚠ Email notifications disabled. Set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.');
  }
});
