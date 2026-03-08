const twilio = require('twilio');

module.exports = (app) => {
  app.post('/api/notify', async (req, res) => {
    const { severityScore, summary } = req.body;

    if (severityScore < 8) {
      return res.json({ sent: false, reason: 'Score below threshold' });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const toNumber = process.env.NOTIFY_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber || !toNumber) {
      console.warn('Twilio credentials not configured, skipping SMS notification');
      return res.status(500).json({ sent: false, reason: 'SMS not configured' });
    }

    try {
      const client = twilio(accountSid, authToken);
      // Twilio trial prepends ~37 chars, so real limit is 160 - 37 = 123
      const MAX = 123;
      const fixed = 'bystander\nCritical scene: \nLocation: 2240 University Ave, Waterloo, ON';
      const room = MAX - fixed.length;
      let short = summary || 'Assistance needed';
      if (short.length > room) {
        short = short.slice(0, room - 3);
        const lastSpace = short.lastIndexOf(' ');
        short = (lastSpace > 0 ? short.slice(0, lastSpace) : short) + '...';
      }
      const body = `bystander\nCritical scene: ${short}\nLocation: 2240 University Ave, Waterloo, ON`;
      console.log(`SMS body length: ${body.length} chars`);

      const message = await client.messages.create({
        body,
        from: fromNumber,
        to: toNumber,
      });

      console.log('SMS sent:', message.sid);
      res.json({ sent: true, messageSid: message.sid });
    } catch (err) {
      console.error('SMS send failed:', err.message);
      res.status(500).json({ sent: false, reason: err.message });
    }
  });
};
