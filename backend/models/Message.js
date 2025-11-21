const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  classCode:  { type: String, required: true },
  senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  senderName: String,
  text:       String,
  cleaned:    String,
  timestamp:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
