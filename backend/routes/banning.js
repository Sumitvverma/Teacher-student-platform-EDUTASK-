const express = require('express');
const Moderation = require('../models/Moderation');
const router = express.Router();
const moderationStore  =require('../utils/db');
function getKey(senderName) {
  if (senderName) return `name:${senderName}`;
}
router.post('/ban', async (req, res) => {
  try {
    const { userId, minutes } = req.body;
    const bannedUntil = new Date(Date.now() + (minutes || 10) * 60 * 1000);
    await Moderation.findOneAndUpdate(
      { userId },
      { bannedUntil, strikes: 0 },
      { upsert: true, new: true }
    );
    res.json({ success: true, bannedUntil });
  } catch (err) {
    res.status(500).json({ error: 'Ban failed' });
  }
});

router.post('/unban', async (req, res) => {
  try {
    const { userId } = req.body;
    await Moderation.findOneAndUpdate(
      { userId },
      { bannedUntil: null, strikes: 0 }
    );

    const key = getKey(userId);
      const now = Date.now();
    moderationStore[key]=now;
    res.json({ success: true, message: 'User unbanned' });
  } catch (err) {
    res.status(500).json({ error: 'Unban failed' });
  }
});

module.exports = router;
