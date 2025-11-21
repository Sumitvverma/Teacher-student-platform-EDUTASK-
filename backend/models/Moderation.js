const mongoose = require('mongoose');

const moderationSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  strikes:    { type: Number, default: 0 },
  bannedUntil:{ type: Date, default: null },
  lastStrike: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Moderation', moderationSchema);
