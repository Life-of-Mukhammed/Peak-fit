const router = require('express').Router();
const auth = require('../middleware/clubAuth');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Tariff = require('../models/Tariff');
const Sale = require('../models/Sale');
const Service = require('../models/Service');
const Attendance = require('../models/Attendance');
const Branch = require('../models/Branch');
const Settings = require('../models/Settings');

router.post('/reset', auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    if (!me || me.role !== 'superadmin') {
      return res.status(403).json({ message: 'Faqat superadmin tozalashga ruxsat etilgan' });
    }
    const club = me.club;
    await Promise.all([
      Customer.deleteMany({ club }),
      Product.deleteMany({ club }),
      Tariff.deleteMany({ club }),
      Sale.deleteMany({ club }),
      Service.deleteMany({ club }),
      Attendance.deleteMany({ club }),
      Branch.deleteMany({ club }),
      Settings.deleteMany({ club }),
      User.deleteMany({ club, _id: { $ne: me._id } }),
    ]);
    res.json({ message: 'Barcha ma\'lumotlar tozalandi' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
