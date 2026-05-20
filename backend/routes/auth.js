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
      { id: user._id, role: user.role, permissions: user.permissions, name: user.name },
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

// PERM_PRESETS — default permission set per role
const PRESETS = {
  superadmin: { kassa: true,  mijozlar: true,  ombor: true,  xodimlar: true,  tariflar: true,  hisobotlar: true,  sozlamalar: true  },
  admin:      { kassa: true,  mijozlar: true,  ombor: true,  xodimlar: true,  tariflar: true,  hisobotlar: true,  sozlamalar: true  },
  manager:    { kassa: true,  mijozlar: true,  ombor: true,  xodimlar: false, tariflar: false, hisobotlar: true,  sozlamalar: false },
  cashier:    { kassa: true,  mijozlar: true,  ombor: false, xodimlar: false, tariflar: false, hisobotlar: false, sozlamalar: false },
};

router.post('/seed', async (req, res) => {
  try {
    const seedList = [
      { login: 'superadmin', password: 'super123',   name: 'Super',   surname: 'Admin',   role: 'superadmin' },
      { login: 'admin',      password: 'admin123',   name: 'Admin',   surname: 'Birinchi',role: 'admin'      },
      { login: 'manager',    password: 'manager123', name: 'Manager', surname: 'Birinchi',role: 'manager'    },
      { login: 'kassir',     password: 'kassir123',  name: 'Kassir',  surname: 'Birinchi',role: 'cashier'    },
    ];
    const results = [];
    for (const u of seedList) {
      const exists = await User.findOne({ login: u.login });
      if (exists) {
        if (exists.role !== u.role) {
          exists.role = u.role;
          exists.permissions = PRESETS[u.role];
          await exists.save();
          results.push(`${u.login} roli yangilandi: ${u.role}`);
        } else {
          results.push(`${u.login} mavjud (${u.role})`);
        }
        continue;
      }
      await new User({ ...u, permissions: PRESETS[u.role] }).save();
      results.push(`${u.login} yaratildi (parol: ${u.password})`);
    }
    res.json({ message: results.join('; ') });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
