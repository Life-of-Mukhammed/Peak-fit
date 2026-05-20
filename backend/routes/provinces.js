const express = require('express');
const Province = require('../models/Province');
const District = require('../models/District');
const Customer = require('../models/Customer');
const Branch = require('../models/Branch');
const Dealer = require('../models/Dealer');
const auth = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

const router = express.Router();
router.use(auth);

// GET /api/provinces — list with stats
router.get('/', async (req, res) => {
  try {
    const provinces = await Province.find().sort({ name: 1 }).lean();
    const ids = provinces.map(p => p._id);
    const [districtCounts, clubCounts, dealerCounts] = await Promise.all([
      District.aggregate([{ $match: { province: { $in: ids } } }, { $group: { _id: '$province', n: { $sum: 1 } } }]),
      Branch.aggregate([{ $match: { province: { $in: ids } } }, { $group: { _id: '$province', n: { $sum: 1 } } }]),
      Dealer.aggregate([{ $match: { province: { $in: ids } } }, { $group: { _id: '$province', n: { $sum: 1 } } }]),
    ]);
    const m = (arr) => Object.fromEntries(arr.map(a => [String(a._id), a.n]));
    const d = m(districtCounts), c = m(clubCounts), de = m(dealerCounts);
    const out = provinces.map(p => ({
      ...p,
      districtCount: d[String(p._id)] || 0,
      clubsCount:    c[String(p._id)] || 0,
      dealersCount:  de[String(p._id)] || 0,
    }));
    res.json(out);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/provinces/:id
router.get('/:id', async (req, res) => {
  try {
    const p = await Province.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ message: 'Topilmadi' });
    const [districts, clubs, dealers] = await Promise.all([
      District.find({ province: p._id }).populate('dealer', 'firstName lastName').lean(),
      Branch.find({ province: p._id }).lean(),
      Dealer.find({ province: p._id }).lean(),
    ]);
    res.json({ ...p, districts, clubs, dealers });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const created = await Province.create(req.body);
    await AuditLog.create({
      user: req.user.id, userName: req.user.name || 'Admin',
      action: 'create', description: `Yangi viloyat qo'shildi: ${created.name}`,
      object: created.name, objectType: 'province', ip: req.ip,
    });
    res.json(created);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Province.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await AuditLog.create({
      user: req.user.id, userName: req.user.name || 'Admin',
      action: 'update', description: `Viloyat o'zgartirildi: ${updated.name}`,
      object: updated.name, objectType: 'province', ip: req.ip,
    });
    res.json(updated);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const inUse = await District.countDocuments({ province: req.params.id });
    if (inUse) return res.status(400).json({ message: `${inUse} ta tuman biriktirilgan` });
    const p = await Province.findByIdAndDelete(req.params.id);
    if (p) await AuditLog.create({
      user: req.user.id, userName: req.user.name || 'Admin',
      action: 'delete', description: `Viloyat o'chirildi: ${p.name}`,
      object: p.name, objectType: 'province', ip: req.ip,
    });
    res.json({ success: true });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// POST /api/provinces/seed-uz — preload all Uzbekistan regions
router.post('/seed-uz', async (req, res) => {
  const list = [
    { name: "Toshkent shahri",        code: "TSH", region: "markaziy", phoneCode: "+998 71" },
    { name: "Toshkent viloyati",      code: "TSV", region: "markaziy", phoneCode: "+998 70" },
    { name: "Samarqand viloyati",     code: "SAM", region: "markaziy", phoneCode: "+998 66" },
    { name: "Buxoro viloyati",        code: "BUX", region: "markaziy", phoneCode: "+998 65" },
    { name: "Navoiy viloyati",        code: "NVI", region: "markaziy", phoneCode: "+998 79" },
    { name: "Qashqadaryo viloyati",   code: "QSH", region: "janubiy",  phoneCode: "+998 75" },
    { name: "Surxondaryo viloyati",   code: "SUR", region: "janubiy",  phoneCode: "+998 76" },
    { name: "Jizzax viloyati",        code: "JIZ", region: "markaziy", phoneCode: "+998 72" },
    { name: "Sirdaryo viloyati",      code: "SIR", region: "markaziy", phoneCode: "+998 67" },
    { name: "Andijon viloyati",       code: "AND", region: "sharqiy",  phoneCode: "+998 74" },
    { name: "Farg'ona viloyati",      code: "FRG", region: "sharqiy",  phoneCode: "+998 73" },
    { name: "Namangan viloyati",      code: "NAM", region: "sharqiy",  phoneCode: "+998 69" },
    { name: "Xorazm viloyati",        code: "XOR", region: "shimoliy", phoneCode: "+998 62" },
    { name: "Qoraqalpog'iston",       code: "QRP", region: "shimoliy", phoneCode: "+998 61" },
  ];
  const created = [];
  for (const it of list) {
    const exists = await Province.findOne({ code: it.code });
    if (!exists) created.push(await Province.create(it));
  }
  res.json({ inserted: created.length, total: list.length });
});

module.exports = router;
