const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  province:   { type: mongoose.Schema.Types.ObjectId, ref: 'Province', required: true },
  type:       { type: String, enum: ['shahar', 'qishloq', 'shahar_tumani'], default: 'shahar_tumani' },
  population: { type: Number, default: 0 },
  dealer:     { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', default: null },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

districtSchema.index({ province: 1, name: 1 });

module.exports = mongoose.model('District', districtSchema);
