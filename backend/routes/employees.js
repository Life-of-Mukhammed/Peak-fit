const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const auth = require('../middleware/clubAuth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `employee_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

router.get('/', auth, async (req, res) => {
  try {
    const employees = await User.find({ club: req.user.club }).select('-password').sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await User.findOne({ _id: req.params.id, club: req.user.club }).select('-password');
    if (!employee) return res.status(404).json({ message: 'Xodim topilmadi' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, upload.single('photo'), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || '{}');
    if (data.role === 'platformAdmin') {
      return res.status(400).json({ message: 'Bu rolni klub ichida yaratish mumkin emas' });
    }
    const existing = await User.findOne({ login: data.login });
    if (existing) return res.status(400).json({ message: 'Bu login band' });

    const employee = new User({
      ...data,
      club: req.user.club,
      photo: req.file ? `/uploads/${req.file.filename}` : null,
    });
    await employee.save();

    const result = employee.toObject();
    delete result.password;
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, upload.single('photo'), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || '{}');
    if (req.file) data.photo = `/uploads/${req.file.filename}`;
    delete data.club;
    if (data.role === 'platformAdmin') {
      return res.status(400).json({ message: 'Bu rolga o\'zgartirib bo\'lmaydi' });
    }

    if (data.password) {
      const bcrypt = require('bcryptjs');
      data.password = await bcrypt.hash(data.password, 10);
    } else {
      delete data.password;
    }

    const employee = await User.findOneAndUpdate(
      { _id: req.params.id, club: req.user.club },
      data,
      { new: true }
    ).select('-password');
    if (!employee) return res.status(404).json({ message: 'Xodim topilmadi' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'O\'zingizni o\'chira olmaysiz' });
    }
    const result = await User.findOneAndDelete({ _id: req.params.id, club: req.user.club });
    if (!result) return res.status(404).json({ message: 'Xodim topilmadi' });
    res.json({ message: 'Xodim o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
