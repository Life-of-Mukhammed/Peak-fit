const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  club:        { type: mongoose.Schema.Types.ObjectId, ref: 'PlatformClub', required: true, index: true },
  name:        { type: String, required: true },
  description: String,
  icon:        String,
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
