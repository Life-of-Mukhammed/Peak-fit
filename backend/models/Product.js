const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  image: String,
  purchasePrice: { type: Number, required: true },
  salePrice: { type: Number, required: true },
  barcode: String,
  type: String,
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
