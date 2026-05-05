const router = require('express').Router();
const Branch = require('../models/Branch');
const auth = require('../middleware/clubAuth');

router.get('/', auth, async (req, res) => {
  try {
    const branches = await Branch.find({ club: req.user.club }).sort({ isMain: -1, createdAt: 1 });
    res.json(branches);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    if (req.body.isMain) {
      await Branch.updateMany({ club: req.user.club }, { isMain: false });
    }
    const branch = new Branch({ ...req.body, club: req.user.club });
    await branch.save();
    res.status(201).json(branch);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.club;
    if (data.isMain) {
      await Branch.updateMany({ club: req.user.club, _id: { $ne: req.params.id } }, { isMain: false });
    }
    const branch = await Branch.findOneAndUpdate(
      { _id: req.params.id, club: req.user.club },
      data,
      { new: true }
    );
    if (!branch) return res.status(404).json({ message: 'Filial topilmadi' });
    res.json(branch);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const branch = await Branch.findOne({ _id: req.params.id, club: req.user.club });
    if (!branch) return res.status(404).json({ message: 'Filial topilmadi' });
    if (branch.isMain) return res.status(400).json({ message: 'Asosiy filialni o\'chirib bo\'lmaydi' });
    await Branch.findByIdAndDelete(req.params.id);
    res.json({ message: 'Filial o\'chirildi' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
