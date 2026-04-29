const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  dob: String,
  phone: String,
  photo: String,
  login: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'cashier'], default: 'cashier' },
  permissions: {
    kassa: { type: Boolean, default: true },
    mijozlar: { type: Boolean, default: false },
    ombor: { type: Boolean, default: false },
    xodimlar: { type: Boolean, default: false },
    tariflar: { type: Boolean, default: false },
    hisobotlar: { type: Boolean, default: false },
    sozlamalar: { type: Boolean, default: false },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
