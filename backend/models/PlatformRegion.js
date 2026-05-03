const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  name: { type: String, required: true },
}, { timestamps: true });

const regionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  districts: [districtSchema],
}, { timestamps: true });

module.exports = mongoose.model('PlatformRegion', regionSchema);
