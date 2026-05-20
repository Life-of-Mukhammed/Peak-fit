const mongoose = require('mongoose');

const platformTariffSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true },
  price:       { type: Number, default: 0 },
  description: String,
  color:       { type: String, default: '#22c55e' },
  isActive:    { type: Boolean, default: true },
  limits: {
    branches:  { type: Number, default: 1 },
    employees: { type: Number, default: 1 },
    customers: { type: Number, default: 100 },
    admins:    { type: Number, default: 1 },
  },
  features: {
    inventory:        { type: Boolean, default: false },
    reports3Months:   { type: Boolean, default: false },
    reportsUnlimited: { type: Boolean, default: false },
    debt:             { type: Boolean, default: false },
    camera:           { type: Boolean, default: false },
    scanner:          { type: Boolean, default: false },
    computerOnly:     { type: Boolean, default: true },
    bar:              { type: Boolean, default: false },
    sms:              { type: Boolean, default: false },
    telegram:         { type: Boolean, default: false },
  },
  sort: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('PlatformTariff', platformTariffSchema);
