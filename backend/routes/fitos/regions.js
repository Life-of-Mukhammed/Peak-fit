const router = require('express').Router();
const guard = require('../../middleware/platformAuth');
const Region = require('../../models/PlatformRegion');

router.use(guard);

router.get('/', async (req, res) => {
  const list = await Region.find().sort({ name: 1 });
  res.json(list);
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Viloyat nomi kerak' });
    const r = await Region.create({ name: name.trim() });
    res.json(r);
  } catch (e) {
    res.status(400).json({ message: e.code === 11000 ? 'Bunday viloyat allaqachon mavjud' : e.message });
  }
});

router.put('/:id', async (req, res) => {
  const r = await Region.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
  res.json(r);
});

router.delete('/:id', async (req, res) => {
  await Region.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.post('/:id/districts', async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Tuman/shahar nomi kerak' });
  const r = await Region.findById(req.params.id);
  if (!r) return res.status(404).json({ message: 'Viloyat topilmadi' });
  r.districts.push({ name: name.trim() });
  await r.save();
  res.json(r);
});

router.put('/:id/districts/:dId', async (req, res) => {
  const r = await Region.findById(req.params.id);
  if (!r) return res.status(404).json({ message: 'Viloyat topilmadi' });
  const d = r.districts.id(req.params.dId);
  if (!d) return res.status(404).json({ message: 'Tuman topilmadi' });
  d.name = req.body.name;
  await r.save();
  res.json(r);
});

router.delete('/:id/districts/:dId', async (req, res) => {
  const r = await Region.findById(req.params.id);
  if (!r) return res.status(404).json({ message: 'Viloyat topilmadi' });
  r.districts.id(req.params.dId)?.deleteOne();
  await r.save();
  res.json(r);
});

module.exports = router;
