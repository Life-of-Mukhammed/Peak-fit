const mongoose = require('mongoose');

const tariffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  validHours: String,
  validFrom: String,
  validTo: String,
  features: [String],
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Tariff', tariffSchema);
