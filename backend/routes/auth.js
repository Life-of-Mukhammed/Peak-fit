const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    const user = await User.findOne({ login, isActive: true });
    if (!user) return res.status(401).json({ message: 'Login yoki parol noto\'g\'ri' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Login yoki parol noto\'g\'ri' });

    const token = jwt.sign(
      { id: user._id, role: user.role, permissions: user.permissions },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        surname: user.surname,
        login: user.login,
        role: user.role,
        photo: user.photo,
        permissions: user.permissions,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/seed', async (req, res) => {
  try {
    const existing = await User.findOne({ login: 'admin' });
    if (existing) return res.json({ message: 'Admin already exists' });

    const admin = new User({
      name: 'Super',
      surname: 'Admin',
      login: 'admin',
      password: 'admin123',
      role: 'superadmin',
      permissions: {
        kassa: true, mijozlar: true, ombor: true,
        xodimlar: true, tariflar: true, hisobotlar: true, sozlamalar: true,
      }
    });
    await admin.save();
    res.json({ message: 'Admin created: login=admin, password=admin123' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
