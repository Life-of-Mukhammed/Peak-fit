const router = require('express').Router();
const guard = require('../../middleware/platformAuth');
const Tariff = require('../../models/PlatformTariff');

router.use(guard);

router.get('/', async (req, res) => {
  res.json(await Tariff.find().sort({ sort: 1, price: 1 }));
});

router.post('/', async (req, res) => {
  try {
    const t = await Tariff.create(req.body);
    res.json(t);
  } catch (e) {
    res.status(400).json({ message: e.code === 11000 ? 'Bunday tarif mavjud' : e.message });
  }
});

router.put('/:id', async (req, res) => {
  const t = await Tariff.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(t);
});

router.delete('/:id', async (req, res) => {
  await Tariff.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
