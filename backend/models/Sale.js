const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number,
    price: Number,
    total: Number,
  }],
  tariff: { type: mongoose.Schema.Types.ObjectId, ref: 'Tariff' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'debt'], default: 'cash' },
  saleType: { type: String, enum: ['product', 'tariff'], default: 'product' },
  note: String,
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
