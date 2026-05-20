const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userName:    { type: String, default: 'Tizim' },
  action:      { type: String, enum: ['create', 'update', 'delete', 'export', 'auth', 'auth_fail', 'system'], required: true },
  description: { type: String, required: true },
  object:      { type: String, default: '' },
  objectType:  { type: String, default: '' },
  ip:          { type: String, default: '' },
  meta:        { type: Object, default: {} },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
