const express = require('express');
const Dealer = require('../models/Dealer');
const Branch = require('../models/Branch');
const Sale = require('../models/Sale');
const auth = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const q = {};
    if (req.query.provinceId) q.province = req.query.provinceId;
    if (req.query.status)     q.status = req.query.status;
    const items = await Dealer.find(q)
      .populate('province', 'name code')
      .populate('districts', 'name')
      .sort({ monthlyCommission: -1, createdAt: -1 })
      .lean();
    const ids = items.map(d => d._id);
    const clubCounts = await Branch.aggregate([
      { $match: { dealer: { $in: ids } } },
      { $group: { _id: '$dealer', n: { $sum: 1 } } },
    ]);
    const cmap = Object.fromEntries(clubCounts.map(c => [String(c._id), c.n]));
    res.json(items.map(d => ({ ...d, clubsCount: cmap[String(d._id)] || 0 })));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const d = await Dealer.findById(req.params.id)
      .populate('province', 'name code')
      .populate('districts', 'name');
    if (!d) return res.status(404).json({ message: 'Topilmadi' });
    const clubs = await Branch.find({ dealer: d._id })
      .populate('province', 'name')
      .populate('district', 'name')
      .lean();
    res.json({ ...d.toObject(), clubs });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const created = await Dealer.create(req.body);
    await AuditLog.create({
      user: req.user.id, userName: req.user.name || 'Admin',
      action: 'create', description: `Yangi diller: ${created.firstName} ${created.lastName}`,
      object: `${created.firstName} ${created.lastName}`, objectType: 'dealer', ip: req.ip,
    });
    res.json(created);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Dealer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await AuditLog.create({
      user: req.user.id, userName: req.user.name || 'Admin',
      action: 'update', description: `Diller o'zgartirildi: ${updated.firstName} ${updated.lastName}`,
      object: `${updated.firstName} ${updated.lastName}`, objectType: 'dealer', ip: req.ip,
    });
    res.json(updated);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const d = await Dealer.findByIdAndDelete(req.params.id);
    if (d) await AuditLog.create({
      user: req.user.id, userName: req.user.name || 'Admin',
      action: 'delete', description: `Diller o'chirildi: ${d.firstName} ${d.lastName}`,
      object: `${d.firstName} ${d.lastName}`, objectType: 'dealer', ip: req.ip,
    });
    res.json({ success: true });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = router;
