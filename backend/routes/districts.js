const express = require('express');
const District = require('../models/District');
const Branch = require('../models/Branch');
const auth = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const q = {};
    if (req.query.provinceId) q.province = req.query.provinceId;
    const items = await District.find(q)
      .populate('province', 'name code')
      .populate('dealer', 'firstName lastName')
      .sort({ name: 1 })
      .lean();
    const ids = items.map(d => d._id);
    const counts = await Branch.aggregate([
      { $match: { district: { $in: ids } } },
      { $group: { _id: '$district', n: { $sum: 1 } } },
    ]);
    const cmap = Object.fromEntries(counts.map(c => [String(c._id), c.n]));
    res.json(items.map(d => ({ ...d, clubsCount: cmap[String(d._id)] || 0 })));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const d = await District.findById(req.params.id)
      .populate('province', 'name code')
      .populate('dealer', 'firstName lastName phone');
    if (!d) return res.status(404).json({ message: 'Topilmadi' });
    res.json(d);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const created = await District.create(req.body);
    await AuditLog.create({
      user: req.user.id, userName: req.user.name || 'Admin',
      action: 'create', description: `Yangi tuman: ${created.name}`,
      object: created.name, objectType: 'district', ip: req.ip,
    });
    res.json(created);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await District.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await AuditLog.create({
      user: req.user.id, userName: req.user.name || 'Admin',
      action: 'update', description: `Tuman o'zgartirildi: ${updated.name}`,
      object: updated.name, objectType: 'district', ip: req.ip,
    });
    res.json(updated);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const inUse = await Branch.countDocuments({ district: req.params.id });
    if (inUse) return res.status(400).json({ message: `${inUse} ta club biriktirilgan` });
    const d = await District.findByIdAndDelete(req.params.id);
    if (d) await AuditLog.create({
      user: req.user.id, userName: req.user.name || 'Admin',
      action: 'delete', description: `Tuman o'chirildi: ${d.name}`,
      object: d.name, objectType: 'district', ip: req.ip,
    });
    res.json({ success: true });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = router;
