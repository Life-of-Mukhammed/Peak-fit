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
    const results = [];
    if (!await User.findOne({ login: 'admin' })) {
      await new User({
        name: 'Super', surname: 'Admin', login: 'admin', password: 'admin123',
        role: 'superadmin',
        permissions: { kassa: true, mijozlar: true, ombor: true, xodimlar: true, tariflar: true, hisobotlar: true, sozlamalar: true },
      }).save();
      results.push('admin yaratildi (login=admin, parol=admin123)');
    } else { results.push('admin mavjud'); }

    if (!await User.findOne({ login: 'manager' })) {
      await new User({
        name: 'Manager', surname: 'Birinchi', login: 'manager', password: 'manager123',
        role: 'admin',
        permissions: { kassa: true, mijozlar: true, ombor: true, xodimlar: false, tariflar: true, hisobotlar: true, sozlamalar: false },
      }).save();
      results.push('manager yaratildi (login=manager, parol=manager123)');
    } else { results.push('manager mavjud'); }

    if (!await User.findOne({ login: 'manager2' })) {
      await new User({
        name: 'Manager', surname: 'Ikkinchi', login: 'manager2', password: 'manager123',
        role: 'admin',
        permissions: { kassa: true, mijozlar: true, ombor: true, xodimlar: false, tariflar: true, hisobotlar: true, sozlamalar: false },
      }).save();
      results.push('manager2 yaratildi (login=manager2, parol=manager123)');
    } else { results.push('manager2 mavjud'); }

    res.json({ message: results.join('; ') });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
