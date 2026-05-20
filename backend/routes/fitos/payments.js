const router = require('express').Router();
const guard = require('../../middleware/platformAuth');
const Payment = require('../../models/PlatformPayment');
const Club = require('../../models/PlatformClub');

router.use(guard);

router.get('/', async (req, res) => {
  const q = {};
  if (req.query.period) q.period = req.query.period;
  if (req.query.club)   q.club   = req.query.club;
  res.json(await Payment.find(q).populate('club', 'name director phone').populate('tariff', 'name').sort({ paidAt: -1 }));
});

router.get('/stats', async (req, res) => {
  const [byPeriod, totalAmount] = await Promise.all([
    Payment.aggregate([{ $group: { _id: '$period', count: { $sum: 1 }, amount: { $sum: '$amount' } } }]),
    Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);
  res.json({ byPeriod, totalAmount: totalAmount[0]?.total || 0 });
});

const MONTHS = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 };

router.post('/', async (req, res) => {
  try {
    const body = { ...req.body };
    let validUntil = body.validUntil;
    if (!validUntil && MONTHS[body.period]) {
      validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + MONTHS[body.period]);
    }
    const p = await Payment.create({ ...body, validUntil });
    if (body.club) {
      const update = { paymentPeriod: body.period, status: 'active' };
      if (validUntil) update.paidUntil = validUntil;
      await Club.findByIdAndUpdate(body.club, update);
    }
    const out = await Payment.findById(p._id).populate('club', 'name director phone').populate('tariff', 'name');
    res.json(out);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  await Payment.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
