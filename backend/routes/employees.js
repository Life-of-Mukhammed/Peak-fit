const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const auth = require('../middleware/auth');
const scope = require('../middleware/scope');
const AuditLog = require('../models/AuditLog');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `employee_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

const onlyDigits = (s) => String(s || '').replace(/\D/g, '');
const genPassword = () => String(Math.floor(100000 + Math.random() * 900000));

const PERM_PRESETS = {
  admin:    { kassa: true, mijozlar: true, ombor: true, xodimlar: true, tariflar: true, hisobotlar: true, sozlamalar: true },
  manager:  { kassa: true, mijozlar: true, ombor: true, xodimlar: false, tariflar: false, hisobotlar: true, sozlamalar: false },
  cashier:  { kassa: true, mijozlar: true, ombor: false, xodimlar: false, tariflar: false, hisobotlar: false, sozlamalar: false },
};

// Which roles can each requester create?
const CAN_CREATE = {
  superadmin: ['admin', 'manager', 'cashier'],
  admin:      ['manager', 'cashier'],
  manager:    [],
  cashier:    [],
};

router.use(auth, scope);

// ----- GET /api/employees — list scoped users -----
router.get('/', async (req, res) => {
  try {
    const q = {};
    if (req.user.role === 'superadmin') {
      // see everyone
    } else if (req.user.role === 'admin') {
      // see self + employees attached to admin's branches (manager/cashier)
      const ids = req.scopedBranchIds || [];
      q.$or = [
        { _id: req.user.id },
        { branches: { $in: ids }, role: { $in: ['manager', 'cashier'] } },
      ];
    } else {
      // manager / cashier — only see self
      q._id = req.user.id;
    }
    const employees = await User.find(q).select('-password').sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');
    if (!employee) return res.status(404).json({ message: 'Xodim topilmadi' });
    // access check
    if (req.user.role !== 'superadmin' && String(employee._id) !== String(req.user.id)) {
      if (req.user.role !== 'admin') return res.status(403).json({ message: 'Ruxsat yo\'q' });
      const ids = req.scopedBranchIds || [];
      const intersects = (employee.branches || []).some(b => ids.includes(String(b)));
      if (!intersects) return res.status(403).json({ message: 'Ruxsat yo\'q' });
    }
    res.json(employee);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ----- POST /api/employees — create scoped worker -----
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || '{}');
    const allowed = CAN_CREATE[req.user.role] || [];
    if (!allowed.includes(data.role)) {
      return res.status(403).json({ message: `Siz "${data.role}" rolini yarata olmaysiz` });
    }

    // Auto-generate login from phone (digits only) if not provided
    let login = (data.login || '').trim();
    if (!login && data.phone) login = onlyDigits(data.phone);
    if (!login) return res.status(400).json({ message: 'Telefon yoki login majburiy' });

    const existing = await User.findOne({ login });
    if (existing) return res.status(400).json({ message: `Bu login band: ${login}` });

    // Auto-generate password if not provided (6-digit number)
    let password = data.password;
    let generatedPassword = null;
    if (!password) { password = genPassword(); generatedPassword = password; }

    // Attach branches: admin assigns their own scope to the new worker
    let branches = data.branches || [];
    if (req.user.role === 'admin' && (!branches || branches.length === 0)) {
      branches = req.scopedBranchIds || [];
    }

    // Permission preset based on role
    const permissions = { ...(PERM_PRESETS[data.role] || {}), ...(data.permissions || {}) };

    const employee = new User({
      name: data.name,
      surname: data.surname,
      dob: data.dob,
      phone: data.phone,
      login,
      password,
      role: data.role,
      permissions,
      branches,
      photo: req.file ? `/uploads/${req.file.filename}` : null,
    });
    await employee.save();

    await AuditLog.create({
      user: req.user.id, userName: req.user.name || 'Admin',
      action: 'create', description: `Yangi xodim: ${employee.name} ${employee.surname} (${employee.role}, login: ${login})`,
      object: `${employee.name} ${employee.surname}`, objectType: 'user', ip: req.ip,
    });

    const result = employee.toObject();
    delete result.password;
    res.status(201).json({
      ...result,
      credentials: generatedPassword ? { login, password: generatedPassword } : null,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'Xodim topilmadi' });
    // access check
    const isSelf = String(target._id) === String(req.user.id);
    if (!isSelf && req.user.role !== 'superadmin') {
      if (req.user.role !== 'admin') return res.status(403).json({ message: 'Ruxsat yo\'q' });
      const ids = req.scopedBranchIds || [];
      const intersects = (target.branches || []).some(b => ids.includes(String(b)));
      if (!intersects) return res.status(403).json({ message: 'Ruxsat yo\'q' });
      // admins cannot edit a peer admin / superadmin
      if (target.role === 'superadmin' || target.role === 'admin') {
        return res.status(403).json({ message: 'Bu xodimni tahrirlay olmaysiz' });
      }
    }

    const data = JSON.parse(req.body.data || '{}');
    if (req.file) data.photo = `/uploads/${req.file.filename}`;

    // password: hash via pre-save (so don't bypass with findByIdAndUpdate)
    if (data.password) {
      target.password = data.password;
    }
    delete data.password;

    Object.assign(target, data);
    await target.save();

    await AuditLog.create({
      user: req.user.id, userName: req.user.name || 'Admin',
      action: 'update', description: `Xodim o'zgartirildi: ${target.name} ${target.surname}`,
      object: `${target.name} ${target.surname}`, objectType: 'user', ip: req.ip,
    });

    const result = target.toObject();
    delete result.password;
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/reset-password', async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'Xodim topilmadi' });
    // only superadmin can reset anyone; admin can reset their own workers
    if (req.user.role !== 'superadmin') {
      if (req.user.role !== 'admin') return res.status(403).json({ message: 'Ruxsat yo\'q' });
      const ids = req.scopedBranchIds || [];
      const intersects = (target.branches || []).some(b => ids.includes(String(b)));
      if (!intersects || target.role === 'superadmin' || target.role === 'admin') {
        return res.status(403).json({ message: 'Ruxsat yo\'q' });
      }
    }
    const password = genPassword();
    target.password = password;
    await target.save();
    await AuditLog.create({
      user: req.user.id, userName: req.user.name || 'Admin',
      action: 'update', description: `Xodim paroli yangilandi: ${target.login}`,
      object: `${target.name} ${target.surname}`, objectType: 'user', ip: req.ip,
    });
    res.json({ credentials: { login: target.login, password } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: 'O\'zingizni o\'chira olmaysiz' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'Xodim topilmadi' });
    if (req.user.role !== 'superadmin') {
      if (req.user.role !== 'admin') return res.status(403).json({ message: 'Ruxsat yo\'q' });
      const ids = req.scopedBranchIds || [];
      const intersects = (target.branches || []).some(b => ids.includes(String(b)));
      if (!intersects || target.role === 'superadmin' || target.role === 'admin') {
        return res.status(403).json({ message: 'Bu xodimni o\'chira olmaysiz' });
      }
    }
    await User.findByIdAndDelete(req.params.id);
    await AuditLog.create({
      user: req.user.id, userName: req.user.name || 'Admin',
      action: 'delete', description: `Xodim o'chirildi: ${target.name} ${target.surname}`,
      object: `${target.name} ${target.surname}`, objectType: 'user', ip: req.ip,
    });
    res.json({ message: 'Xodim o\'chirildi' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
