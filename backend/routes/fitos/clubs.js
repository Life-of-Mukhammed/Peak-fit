const router = require('express').Router();
const guard = require('../../middleware/platformAuth');
const Club = require('../../models/PlatformClub');
const Region = require('../../models/PlatformRegion');

router.use(guard);

// list with optional status & period filters
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
    const populated = await Club.findById(c._id)
      .populate('region', 'name')
      .populate('serviceType', 'name icon')
      .populate('tariff', 'name color price limits features');
    res.json(populated);
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

router.delete('/:id', async (req, res) => {
  await Club.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
