const router = require('express').Router();
const crypto = require('crypto');
const guard = require('../../middleware/platformAuth');
const Club = require('../../models/PlatformClub');
const Region = require('../../models/PlatformRegion');
const User = require('../../models/User');
const Customer = require('../../models/Customer');
const Sale = require('../../models/Sale');
const Service = require('../../models/Service');
const Product = require('../../models/Product');
const Branch = require('../../models/Branch');
const Tariff = require('../../models/Tariff');
const Settings = require('../../models/Settings');
const Smena = require('../../models/Smena');
const Attendance = require('../../models/Attendance');

router.use(guard);

function slugify(s = '') {
  return s.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20) || 'club';
}

function genPassword() {
  return crypto.randomBytes(9).toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, 10);
}

async function generateUniqueLogin(base) {
  let login = base;
  let n = 0;
  while (await User.findOne({ login })) {
    n += 1;
    login = `${base}${n}`;
  }
  return login;
}

router.get('/', async (req, res) => {
  const q = {};
  if (req.query.status)        q.status        = req.query.status;
  if (req.query.paymentPeriod) q.paymentPeriod = req.query.paymentPeriod;
  const list = await Club.find(q)
    .populate('region', 'name')
    .populate('serviceType', 'name icon')
    .populate('tariff', 'name color price limits features')
    .sort({ createdAt: -1 });
  res.json(list);
});

router.get('/stats', async (req, res) => {
  const [total, demo, active, blocked, byPeriod] = await Promise.all([
    Club.countDocuments(),
    Club.countDocuments({ status: 'demo' }),
    Club.countDocuments({ status: 'active' }),
    Club.countDocuments({ status: 'blocked' }),
    Club.aggregate([{ $group: { _id: '$paymentPeriod', count: { $sum: 1 } } }]),
  ]);
  res.json({ total, demo, active, blocked, byPeriod });
});

router.post('/', async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.region && body.district) {
      const r = await Region.findById(body.region);
      const d = r?.districts.id(body.district);
      if (d) body.districtName = d.name;
    }
    if (!body.demoUntil && body.status === 'demo') {
      body.demoUntil = new Date(Date.now() + 7 * 86400000);
    }
    const c = await Club.create(body);

    const baseLogin = await generateUniqueLogin(`${slugify(c.name)}_admin`);
    const rawPassword = genPassword();
    const adminUser = await new User({
      name: (c.director || c.name || 'Admin').split(' ')[0] || 'Admin',
      surname: (c.director || '').split(' ').slice(1).join(' ') || c.name,
      phone: c.phone,
      login: baseLogin,
      password: rawPassword,
      role: 'superadmin',
      club: c._id,
      permissions: { kassa: true, mijozlar: true, ombor: true, xodimlar: true, tariflar: true, hisobotlar: true, sozlamalar: true },
    }).save();

    await Branch.create({ club: c._id, name: (c.branches?.[0]?.name) || c.name, isMain: true });
    await Settings.create({ club: c._id, gymName: c.name, phone: c.phone });

    const populated = await Club.findById(c._id)
      .populate('region', 'name')
      .populate('serviceType', 'name icon')
      .populate('tariff', 'name color price limits features');

    res.json({
      club: populated,
      credentials: { login: adminUser.login, password: rawPassword },
    });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.region && body.district) {
      const r = await Region.findById(body.region);
      const d = r?.districts.id(body.district);
      if (d) body.districtName = d.name;
    }
    const c = await Club.findByIdAndUpdate(req.params.id, body, { new: true })
      .populate('region', 'name')
      .populate('serviceType', 'name icon')
      .populate('tariff', 'name color price limits features');
    res.json(c);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.post('/:id/block', async (req, res) => {
  const c = await Club.findByIdAndUpdate(req.params.id, { status: 'blocked' }, { new: true });
  res.json(c);
});

router.post('/:id/unblock', async (req, res) => {
  const c = await Club.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true });
  res.json(c);
});

router.post('/:id/extend-demo', async (req, res) => {
  const days = Number(req.body.days || 7);
  const c = await Club.findById(req.params.id);
  if (!c) return res.status(404).json({ message: 'Club topilmadi' });
  const base = c.demoUntil && c.demoUntil > new Date() ? c.demoUntil : new Date();
  c.demoUntil = new Date(base.getTime() + days * 86400000);
  c.status = 'demo';
  await c.save();
  res.json(c);
});

router.post('/:id/reset-credentials', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: 'Klub topilmadi' });
    const admin = await User.findOne({ club: club._id, role: 'superadmin' }).sort({ createdAt: 1 });
    if (!admin) return res.status(404).json({ message: 'Admin foydalanuvchi topilmadi' });
    const rawPassword = genPassword();
    admin.password = rawPassword;
    await admin.save();
    res.json({ login: admin.login, password: rawPassword });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  const clubId = req.params.id;
  await Promise.all([
    Customer.deleteMany({ club: clubId }),
    Sale.deleteMany({ club: clubId }),
    Service.deleteMany({ club: clubId }),
    Product.deleteMany({ club: clubId }),
    Branch.deleteMany({ club: clubId }),
    Tariff.deleteMany({ club: clubId }),
    Settings.deleteMany({ club: clubId }),
    Smena.deleteMany({ club: clubId }),
    Attendance.deleteMany({ club: clubId }),
    User.deleteMany({ club: clubId }),
  ]);
  await Club.findByIdAndDelete(clubId);
  res.json({ ok: true });
});

module.exports = router;
