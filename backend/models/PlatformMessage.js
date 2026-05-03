const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  body: String,
  by:   String,
  at:   { type: Date, default: Date.now },
}, { _id: false });

const platformMessageSchema = new mongoose.Schema({
  club:       { type: mongoose.Schema.Types.ObjectId, ref: 'PlatformClub' },
  clubName:   String,
  fromName:   String,
  fromPhone:  String,
  subject:    String,
  body:       { type: String, required: true },
  status:     { type: String, enum: ['unread', 'read', 'replied'], default: 'unread' },
  replies:    [replySchema],
}, { timestamps: true });

module.exports = mongoose.model('PlatformMessage', platformMessageSchema);
