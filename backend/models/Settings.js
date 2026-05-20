const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'PlatformClub', required: true, unique: true, index: true },
  gymName: { type: String, default: 'Peak Fit' },
  phone: String,
  address: String,
  logo: String,
  currency: { type: String, default: 'UZS' },
  workingHours: String,
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
