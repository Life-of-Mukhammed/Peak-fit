const mongoose = require('mongoose');

const provinceSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  code:        { type: String, required: true, uppercase: true, trim: true, unique: true },
  region:      { type: String, enum: ['markaziy', 'shimoliy', 'janubiy', 'sharqiy'], default: 'markaziy' },
  timezone:    { type: String, default: 'UTC+5' },
  phoneCode:   { type: String, default: '+998' },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Province', provinceSchema);
