const router = require('express').Router();
const Branch = require('../models/Branch');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const branches = await Branch.find().sort({ isMain: -1, createdAt: 1 });
    res.json(branches);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    if (req.body.isMain) {
      await Branch.updateMany({}, { isMain: false });
    }
    const branch = new Branch(req.body);
    await branch.save();
    res.status(201).json(branch);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    if (req.body.isMain) {
      await Branch.updateMany({ _id: { $ne: req.params.id } }, { isMain: false });
    }
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(branch);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (branch?.isMain) return res.status(400).json({ message: 'Asosiy filialni o\'chirib bo\'lmaydi' });
    await Branch.findByIdAndDelete(req.params.id);
    res.json({ message: 'Filial o\'chirildi' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
