const mongoose = require('mongoose');

const smenaSchema = new mongoose.Schema({
  openedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  openedAt: { type: Date, default: Date.now },
  closedAt: Date,
  isOpen: { type: Boolean, default: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  report: {
    totalSales: { type: Number, default: 0 },
    cashSales: { type: Number, default: 0 },
    cardSales: { type: Number, default: 0 },
    debtSales: { type: Number, default: 0 },
    attendanceCount: { type: Number, default: 0 },
    newCustomers: { type: Number, default: 0 },
    saleCount: { type: Number, default: 0 },
  },
}, { timestamps: true });

module.exports = mongoose.model('Smena', smenaSchema);
