const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
}, { timestamps: true });

const platformClubSchema = new mongoose.Schema({
  region:      { type: mongoose.Schema.Types.ObjectId, ref: 'PlatformRegion', required: true },
  district:    { type: mongoose.Schema.Types.ObjectId, required: true },
  districtName:{ type: String },
  serviceType: { type: mongoose.Schema.Types.ObjectId, ref: 'PlatformServiceType', required: true },
  name:        { type: String, required: true },
  director:    { type: String, required: true },
  phone:       { type: String, required: true },
  phoneAlt:    String,
  tariff:      { type: mongoose.Schema.Types.ObjectId, ref: 'PlatformTariff', required: true },
  branches:    [branchSchema],
  status:      { type: String, enum: ['demo', 'active', 'blocked', 'expired'], default: 'demo' },
  paymentPeriod: { type: String, enum: ['demo', 'one-time', '1m', '3m', '6m', '12m'], default: 'demo' },
  demoUntil:   { type: Date },
  paidUntil:   { type: Date },
  notes:       String,
}, { timestamps: true });

module.exports = mongoose.model('PlatformClub', platformClubSchema);
