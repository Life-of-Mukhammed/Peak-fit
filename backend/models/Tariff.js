const mongoose = require('mongoose');

const tariffSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  duration:    { type: Number, required: true },
  validHours:  String,
  validFrom:   String,
  validTo:     String,
  features:    [String],
  services:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  isActive:    { type: Boolean, default: true },

  // KiGo extensions
  tier:               { type: Number, default: 1 }, // 1=Boshlang'ich, 2=Standart, 3=Premium, 4=Enterprise
  description:        { type: String, default: '' },
  dealerCommission:   { type: Number, default: 8 },
  clientLimit:        { type: Number, default: null }, // null = unlimited
  popular:            { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Tariff', tariffSchema);
