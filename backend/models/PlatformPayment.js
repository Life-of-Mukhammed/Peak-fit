const mongoose = require('mongoose');

const platformPaymentSchema = new mongoose.Schema({
  club:    { type: mongoose.Schema.Types.ObjectId, ref: 'PlatformClub', required: true },
  tariff:  { type: mongoose.Schema.Types.ObjectId, ref: 'PlatformTariff' },
  period:  { type: String, enum: ['one-time', '1m', '3m', '6m', '12m'], required: true },
  amount:  { type: Number, required: true },
  paidAt:  { type: Date, default: Date.now },
  validUntil: Date,
  note:    String,
}, { timestamps: true });

module.exports = mongoose.model('PlatformPayment', platformPaymentSchema);
