const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  gymName: { type: String, default: 'Peak Fit' },
  phone: String,
  address: String,
  logo: String,
  currency: { type: String, default: 'UZS' },
  workingHours: String,
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
