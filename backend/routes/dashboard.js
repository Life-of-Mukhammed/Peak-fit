const express = require('express');
const auth = require('../middleware/auth');
const scope = require('../middleware/scope');
const Branch = require('../models/Branch');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Dealer = require('../models/Dealer');
const Province = require('../models/Province');

const router = express.Router();
router.use(auth, scope);

router.get('/', async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Faqat super admin' });
    }
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [clubsCount, dealersCount, activeDealers, monthSales, prevMonthSales,
           overdueCustomers, provinces, clubsByKind] = await Promise.all([
      Branch.countDocuments({ isActive: true }),
      Dealer.countDocuments({}),
      Dealer.countDocuments({ status: 'faol' }),
      Sale.aggregate([
        { $match: { createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Sale.aggregate([
        { $match: { createdAt: { $gte: prevMonthStart, $lt: monthStart } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Customer.countDocuments({ debt: { $gt: 0 } }),
      Province.find().lean(),
      Branch.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$kind', count: { $sum: 1 } } },
      ]),
    ]);

    const monthRevenue = monthSales[0]?.total || 0;
    const prevRevenue  = prevMonthSales[0]?.total || 0;
    const delta = prevRevenue ? ((monthRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    // 12 months trend
    const trend = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const r = await Sale.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]);
      trend.push({
        month: start.toLocaleString('uz-UZ', { month: 'short' }),
        total: r[0]?.total || 0,
      });
    }

    // Top provinces by club count
    const provinceIds = provinces.map(p => p._id);
    const provClubs = await Branch.aggregate([
      { $match: { province: { $in: provinceIds } } },
      { $group: { _id: '$province', n: { $sum: 1 } } },
    ]);
    const cmap = Object.fromEntries(provClubs.map(c => [String(c._id), c.n]));
    const topProvinces = provinces
      .map(p => ({ name: p.name, code: p.code, clubsCount: cmap[String(p._id)] || 0 }))
      .sort((a, b) => b.clubsCount - a.clubsCount)
      .slice(0, 5);

    res.json({
      clubsCount,
      dealersCount,
      activeDealers,
      monthRevenue,
      revenueDelta: delta,
      overdueCount: overdueCustomers,
      trend,
      topProvinces,
      clubsByKind: clubsByKind.map(x => ({ kind: x._id || 'other', count: x.count })),
      provincesCount: provinces.length,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/dashboard/counts — lightweight nav badges for super admin sidebar
router.get('/counts', async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      // Non-super: only what they have access to
      const [clubs, customers] = await Promise.all([
        Branch.countDocuments({ ...req.scopeFilter('_id'), isActive: true }),
        Customer.countDocuments(req.scopeFilterOrNull('branch')),
      ]);
      return res.json({ clubs, customers });
    }
    const [provinces, districts, clubs, dealers, customers] = await Promise.all([
      Province.countDocuments({}),
      require('../models/District').countDocuments({}),
      Branch.countDocuments({ isActive: true }),
      Dealer.countDocuments({}),
      Customer.countDocuments({}),
    ]);
    res.json({ provinces, districts, clubs, dealers, customers });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
