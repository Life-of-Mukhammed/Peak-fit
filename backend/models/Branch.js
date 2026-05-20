const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  address:   String,
  phone:     String,
  email:     String,
  isMain:    { type: Boolean, default: false },
  isActive:  { type: Boolean, default: true },

  // KiGo extensions — club / multi-region CRM
  kind:           { type: String, enum: ['ps', 'tennis', 'billiard', 'fitness', 'other'], default: 'fitness' },
  ownerName:      { type: String, default: '' },
  inn:            { type: String, default: '' },
  description:    { type: String, default: '' },
  contractSigned: { type: Boolean, default: false },
  province:       { type: mongoose.Schema.Types.ObjectId, ref: 'Province', default: null },
  district:       { type: mongoose.Schema.Types.ObjectId, ref: 'District', default: null },
  dealer:         { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer',   default: null },
  tariff:         { type: mongoose.Schema.Types.ObjectId, ref: 'Tariff',   default: null },
  monthlyPayment: { type: Number, default: 0 },
  nextPaymentAt:  { type: Date,   default: null },
  status:         { type: String, enum: ['faol', 'sinov', 'kechikkan', 'toxtatilgan'], default: 'faol' },
  latitude:       { type: Number, default: null },
  longitude:      { type: Number, default: null },
  landmark:       { type: String, default: '' },
  admin:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  parent:         { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);
