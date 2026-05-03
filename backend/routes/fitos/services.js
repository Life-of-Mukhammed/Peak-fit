const router = require('express').Router();
const guard = require('../../middleware/platformAuth');
const ServiceType = require('../../models/PlatformServiceType');

router.use(guard);

router.get('/', async (req, res) => {
  res.json(await ServiceType.find().sort({ name: 1 }));
});

router.post('/', async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Xizmat nomi kerak' });
    const s = await ServiceType.create({ name: name.trim(), description, icon });
    res.json(s);
  } catch (e) {
    res.status(400).json({ message: e.code === 11000 ? 'Bunday xizmat turi mavjud' : e.message });
  }
});

router.put('/:id', async (req, res) => {
  const s = await ServiceType.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(s);
});

router.delete('/:id', async (req, res) => {
  await ServiceType.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
