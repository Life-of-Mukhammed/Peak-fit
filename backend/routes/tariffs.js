const router = require('express').Router();
const Tariff = require('../models/Tariff');
const auth = require('../middleware/clubAuth');

router.get('/', auth, async (req, res) => {
  try {
    const tariffs = await Tariff.find({ club: req.user.club }).populate('services').sort({ createdAt: -1 });
    res.json(tariffs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const tariff = await Tariff.findOne({ _id: req.params.id, club: req.user.club }).populate('services');
    if (!tariff) return res.status(404).json({ message: 'Tarif topilmadi' });
    res.json(tariff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const tariff = new Tariff({ ...req.body, club: req.user.club });
    await tariff.save();
    res.status(201).json(tariff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.club;
    const tariff = await Tariff.findOneAndUpdate(
      { _id: req.params.id, club: req.user.club },
      data,
      { new: true }
    );
    if (!tariff) return res.status(404).json({ message: 'Tarif topilmadi' });
    res.json(tariff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Tariff.findOneAndDelete({ _id: req.params.id, club: req.user.club });
    if (!result) return res.status(404).json({ message: 'Tarif topilmadi' });
    res.json({ message: 'Tarif o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
