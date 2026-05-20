const router = require('express').Router();
const guard = require('../../middleware/platformAuth');
const Dealer = require('../../models/PlatformDealer');

router.use(guard);

router.get('/', async (req, res) => {
  res.json(await Dealer.find().populate('region', 'name').select('-password').sort({ createdAt: -1 }));
});

router.post('/', async (req, res) => {
  try {
    const d = await Dealer.create(req.body);
    const out = await Dealer.findById(d._id).populate('region', 'name').select('-password');
    res.json(out);
  } catch (e) {
    res.status(400).json({ message: e.code === 11000 ? 'Bu login band' : e.message });
  }
});

router.put('/:id', async (req, res) => {
  const body = { ...req.body };
  if (!body.password) delete body.password;
  const d = await Dealer.findById(req.params.id);
  if (!d) return res.status(404).json({ message: 'Diller topilmadi' });
  Object.assign(d, body);
  await d.save();
  const out = await Dealer.findById(d._id).populate('region', 'name').select('-password');
  res.json(out);
});

router.delete('/:id', async (req, res) => {
  await Dealer.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
