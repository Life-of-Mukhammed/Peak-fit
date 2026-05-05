const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Club = require('../models/PlatformClub');
const auth = require('../middleware/auth');

router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    const user = await User.findOne({ login, isActive: true });
    if (!user) return res.status(401).json({ message: 'Login yoki parol noto\'g\'ri' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Login yoki parol noto\'g\'ri' });

    let clubInfo = null;
    if (user.club) {
      const club = await Club.findById(user.club).select('name status demoUntil paidUntil');
      if (!club) return res.status(401).json({ message: 'Klub topilmadi' });
      if (club.status === 'blocked') {
        return res.status(403).json({ message: 'Sizning klubingiz bloklangan. Iltimos, FitOS administratori bilan bog\'laning.' });
      }
      if (club.status === 'expired') {
        return res.status(403).json({ message: 'Klub obunasi tugagan. To\'lovni yangilang.' });
      }
      if (club.status === 'demo' && club.demoUntil && new Date(club.demoUntil) < new Date()) {
        return res.status(403).json({ message: 'Demo muddati tugagan. To\'lovni amalga oshiring.' });
      }
      clubInfo = { id: club._id, name: club.name, status: club.status };
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, club: user.club || null, permissions: user.permissions },
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
        club: clubInfo,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('club', 'name status');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/seed', async (req, res) => {
  try {
    const results = [];
    if (!await User.findOne({ login: 'kivo' })) {
      await new User({
        name: 'Kivo', surname: 'Platform', login: 'kivo', password: 'kivo123',
        role: 'platformAdmin',
        club: null,
        permissions: { kassa: false, mijozlar: false, ombor: false, xodimlar: false, tariflar: false, hisobotlar: false, sozlamalar: false },
      }).save();
      results.push('Kivo platforma admini yaratildi (login=kivo, parol=kivo123)');
    } else { results.push('Kivo platforma admini mavjud'); }

    res.json({ message: results.join('; ') });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
