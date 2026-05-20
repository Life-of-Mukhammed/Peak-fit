const router = require('express').Router();
const Service = require('../models/Service');
const auth = require('../middleware/clubAuth');

router.get('/', auth, async (req, res) => {
  try {
    const services = await Service.find({ club: req.user.club }).sort({ createdAt: -1 });
    res.json(services);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const service = await Service.create({ ...req.body, club: req.user.club });
    res.status(201).json(service);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.club;
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, club: req.user.club },
      data,
      { new: true }
    );
    if (!service) return res.status(404).json({ message: 'Hizmat topilmadi' });
    res.json(service);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Service.findOneAndDelete({ _id: req.params.id, club: req.user.club });
    if (!result) return res.status(404).json({ message: 'Hizmat topilmadi' });
    res.json({ message: 'Hizmat o\'chirildi' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
