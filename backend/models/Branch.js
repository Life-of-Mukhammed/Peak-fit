const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'PlatformClub', required: true, index: true },
  name: { type: String, required: true },
  address: String,
  phone: String,
  isMain: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);
