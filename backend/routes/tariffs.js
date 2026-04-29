const router = require('express').Router();
const Tariff = require('../models/Tariff');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const tariffs = await Tariff.find().populate('services').sort({ createdAt: -1 });
    res.json(tariffs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const tariff = await Tariff.findById(req.params.id).populate('services');
    if (!tariff) return res.status(404).json({ message: 'Tarif topilmadi' });
    res.json(tariff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const tariff = new Tariff(req.body);
    await tariff.save();
    res.status(201).json(tariff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const tariff = await Tariff.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(tariff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Tariff.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tarif o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
