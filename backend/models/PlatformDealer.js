const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const dealerSchema = new mongoose.Schema({
  region:        { type: mongoose.Schema.Types.ObjectId, ref: 'PlatformRegion' },
  name:          { type: String, required: true },
  surname:       { type: String, required: true },
  phone:         { type: String, required: true },
  telegramUser:  String,
  login:         { type: String, required: true, unique: true },
  password:      { type: String, required: true },
  permissions: {
    canCreateClub:    { type: Boolean, default: false },
    canManageTariffs: { type: Boolean, default: false },
    canViewPayments:  { type: Boolean, default: false },
    canBlockClub:     { type: Boolean, default: false },
    canMessageClubs:  { type: Boolean, default: false },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

dealerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

dealerSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('PlatformDealer', dealerSchema);
