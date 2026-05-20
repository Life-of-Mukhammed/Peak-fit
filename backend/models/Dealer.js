const mongoose = require('mongoose');

const dealerSchema = new mongoose.Schema({
  firstName:           { type: String, required: true, trim: true },
  lastName:            { type: String, required: true, trim: true },
  phone:               { type: String, required: true, trim: true },
  email:               { type: String, trim: true, lowercase: true },
  passport:            { type: String, trim: true },
  province:            { type: mongoose.Schema.Types.ObjectId, ref: 'Province', default: null },
  districts:           [{ type: mongoose.Schema.Types.ObjectId, ref: 'District' }],
  commissionRate:      { type: Number, default: 8 },
  firstMonthBonus:     { type: Number, default: 80 },
  status:              { type: String, enum: ['faol', 'sust', 'bloklangan'], default: 'faol' },
  totalCommission:     { type: Number, default: 0 },
  monthlyCommission:   { type: Number, default: 0 },
  rating:              { type: Number, default: 0 },
  user:                { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

dealerSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

dealerSchema.set('toJSON',  { virtuals: true });
dealerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Dealer', dealerSchema);
