const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerId: { type: String, unique: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  photo: String,
  dob: String,
  phone: String,
  qrCode: String,
  activeTariff: {
    tariff: { type: mongoose.Schema.Types.ObjectId, ref: 'Tariff' },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: false },
  },
  debt: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  frozen: { type: Boolean, default: false },
}, { timestamps: true });

customerSchema.pre('save', async function(next) {
  if (!this.customerId) {
    const count = await mongoose.model('Customer').countDocuments();
    this.customerId = `PF${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
