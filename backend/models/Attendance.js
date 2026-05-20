const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  club:      { type: mongoose.Schema.Types.ObjectId, ref: 'PlatformClub', required: true, index: true },
  customer:  { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  date:      { type: String, required: true },
  time:      { type: Date,   default: () => new Date() },
  branch:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User',   default: null },
  source:    { type: String, enum: ['manual', 'qr'], default: 'manual' },
}, { timestamps: true });

attendanceSchema.index({ customer: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
