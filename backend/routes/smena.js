const router = require('express').Router();
const Smena = require('../models/Smena');
const Sale = require('../models/Sale');
const Attendance = require('../models/Attendance');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

// Get current globally open smena
router.get('/current', auth, async (req, res) => {
  try {
    const smena = await Smena.findOne({ isOpen: true })
      .populate('openedBy', 'name surname');
    res.json(smena || null);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Open a new smena — only 1 can be open at a time globally
router.post('/open', auth, async (req, res) => {
  try {
    const existing = await Smena.findOne({ isOpen: true });
    if (existing) {
      return res.status(400).json({
        message: `Hozir smena ochiq (${existing.openedBy?.name || ''}). Avval uni yoping.`
      });
    }
    const smena = await Smena.create({ openedBy: req.user.id, branch: req.body.branch || null });
    const populated = await Smena.findById(smena._id).populate('openedBy', 'name surname');
    res.status(201).json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Close current open smena — generate report
router.post('/close', auth, async (req, res) => {
  try {
    const smena = await Smena.findOne({ isOpen: true });
    if (!smena) return res.status(404).json({ message: 'Ochiq smena topilmadi' });

    const since = smena.openedAt;
    const now = new Date();
    const openerId = smena.openedBy.toString();

    const sales = await Sale.find({
      cashier: openerId, createdAt: { $gte: since, $lte: now },
      saleType: { $ne: 'debt_payment' }
    });
    const debtPayments = await Sale.find({
      cashier: openerId, createdAt: { $gte: since, $lte: now },
      saleType: 'debt_payment'
    });

    const allCash = [...sales, ...debtPayments].filter(x => x.paymentMethod === 'cash');
    const allCard = [...sales, ...debtPayments].filter(x => x.paymentMethod === 'card');
    const cashSales  = allCash.reduce((s, x) => s + x.total, 0);
    const cardSales  = allCard.reduce((s, x) => s + x.total, 0);
    const debtSales  = sales.filter(x => x.paymentMethod === 'debt').reduce((s, x) => s + x.total, 0);
    const totalSales = cashSales + cardSales;

    const today = now.toISOString().split('T')[0];
    const attendanceCount = await Attendance.countDocuments({ date: today });
    const newCustomers = await Customer.countDocuments({ createdAt: { $gte: since, $lte: now } });

    smena.isOpen = false;
    smena.closedAt = now;
    smena.report = {
      totalSales, cashSales, cardSales, debtSales,
      attendanceCount, newCustomers,
      saleCount: sales.length,
    };
    await smena.save();

    const populated = await Smena.findById(smena._id).populate('openedBy', 'name surname');
    res.json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Per-employee stats from all closed smenas
router.get('/stats', auth, async (req, res) => {
  try {
    const smenas = await Smena.find({ isOpen: false })
      .populate('openedBy', 'name surname _id');

    const map = {};
    for (const s of smenas) {
      const uid = s.openedBy?._id?.toString();
      if (!uid) continue;
      if (!map[uid]) {
        map[uid] = {
          userId: uid,
          user: s.openedBy,
          totalSales: 0, cashSales: 0, cardSales: 0, debtSales: 0,
          saleCount: 0, totalMinutes: 0, smenaCount: 0,
        };
      }
      const r = s.report;
      map[uid].totalSales += r.totalSales || 0;
      map[uid].cashSales  += r.cashSales  || 0;
      map[uid].cardSales  += r.cardSales  || 0;
      map[uid].debtSales  += r.debtSales  || 0;
      map[uid].saleCount  += r.saleCount  || 0;
      map[uid].smenaCount += 1;
      if (s.closedAt) {
        map[uid].totalMinutes += Math.round((new Date(s.closedAt) - new Date(s.openedAt)) / 60000);
      }
    }
    res.json(Object.values(map));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get all closed smenas (admin history)
router.get('/history', auth, async (req, res) => {
  try {
    const list = await Smena.find({ isOpen: false })
      .populate('openedBy', 'name surname')
      .sort({ closedAt: -1 })
      .limit(100);
    res.json(list);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
