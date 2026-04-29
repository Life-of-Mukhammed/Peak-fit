const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Tariff = require('../models/Tariff');
const Sale = require('../models/Sale');
const Service = require('../models/Service');
const Attendance = require('../models/Attendance');
const Branch = require('../models/Branch');
const Settings = require('../models/Settings');

// Wipe ALL business data — keeps only the current superadmin
router.post('/reset', auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    if (!me || me.role !== 'superadmin') {
      return res.status(403).json({ message: 'Faqat superadmin tozalashga ruxsat etilgan' });
    }
    await Promise.all([
      Customer.deleteMany({}),
      Product.deleteMany({}),
      Tariff.deleteMany({}),
      Sale.deleteMany({}),
      Service.deleteMany({}),
      Attendance.deleteMany({}),
      Branch.deleteMany({}),
      Settings.deleteMany({}),
      User.deleteMany({ _id: { $ne: me._id } }),
    ]);
    res.json({ message: 'Barcha ma\'lumotlar tozalandi' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
