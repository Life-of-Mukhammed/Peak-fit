const router = require('express').Router();
const Branch = require('../models/Branch');
const User = require('../models/User');
const auth = require('../middleware/auth');
const scope = require('../middleware/scope');
const AuditLog = require('../models/AuditLog');

const onlyDigits = (s) => String(s || '').replace(/\D/g, '');
const genPassword = () => String(Math.floor(100000 + Math.random() * 900000));

const PERMS_ADMIN = { kassa: true, mijozlar: true, ombor: true, xodimlar: true, tariflar: true, hisobotlar: true, sozlamalar: true };

router.use(auth, scope);

router.get('/', async (req, res) => {
  try {
    const q = req.scopeFilter('_id');           // restrict to user's branches
    if (req.query.provinceId) q.province = req.query.provinceId;
    if (req.query.districtId) q.district = req.query.districtId;
    if (req.query.dealerId)   q.dealer   = req.query.dealerId;
    if (req.query.kind)       q.kind     = req.query.kind;
    if (req.query.status)     q.status   = req.query.status;
    const branches = await Branch.find(q)
      .populate('province', 'name code')
      .populate('district', 'name')
      .populate('dealer',   'firstName lastName')
      .populate('tariff',   'name price tier')
      .sort({ isMain: -1, createdAt: -1 });
    res.json(branches);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    if (!req.canAccessBranch(req.params.id)) return res.status(403).json({ message: 'Ruxsat yo\'q' });
    const b = await Branch.findById(req.params.id)
      .populate('province', 'name code')
      .populate('district', 'name')
      .populate('dealer',   'firstName lastName phone commissionRate')
      .populate('tariff',   'name price tier duration');
    if (!b) return res.status(404).json({ message: 'Topilmadi' });
    res.json(b);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    // Super admin: creates a NEW main filial (a new "club" with its own admin)
    // Admin: creates a sub-filial INSIDE their own main filial — no new login is issued
    const isSuper = req.user.role === 'superadmin';
    if (!isSuper && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Faqat super admin yoki direktor yangi filial qo\'sha oladi' });
    }

    const data = { ...req.body };
    if (!isSuper) {
      // admin creating a sub-filial: enforce it lives under their own main
      data.isMain = false;
      data.autoCreateAdmin = false;
      // pick parent: explicit or first main filial in admin's scope
      if (!data.parent) {
        const mine = await Branch.findOne({ _id: { $in: req.scopedBranchIds || [] }, isMain: true });
        data.parent = mine ? mine._id : (req.scopedBranchIds?.[0] || null);
      }
      // inherit dealer/province/district/admin from parent if missing
      if (data.parent) {
        const parentDoc = await Branch.findById(data.parent);
        if (parentDoc) {
          data.admin    = data.admin    || parentDoc.admin || req.user.id;
          data.province = data.province || parentDoc.province;
          data.district = data.district || parentDoc.district;
          data.dealer   = data.dealer   || parentDoc.dealer;
        }
      } else {
        data.admin = data.admin || req.user.id;
      }
    } else {
      // super admin creating a main filial
      if (data.isMain === undefined) data.isMain = true;
    }

    if (data.isMain) await Branch.updateMany({}, { isMain: false });
    const branch = new Branch(data);
    await branch.save();

    // If admin created the sub-filial, attach it to their branches list so scoping works
    if (!isSuper) {
      const u = await User.findById(req.user.id);
      if (u && !(u.branches || []).some(b => String(b) === String(branch._id))) {
        u.branches = [...(u.branches || []), branch._id];
        await u.save();
      }
    }

    // Auto-create club admin — ONLY when super admin creates a main filial
    let credentials = null;
    const autoCreate = isSuper && req.body.autoCreateAdmin !== false;
    if (autoCreate && branch.phone) {
      const login = onlyDigits(branch.phone);
      if (login.length >= 7) {
        const password = genPassword();
        let adminUser = await User.findOne({ login });
        if (!adminUser) {
          // brand-new user
          adminUser = new User({
            name: branch.ownerName || branch.name || 'Admin',
            surname: 'Club admin',
            login,
            password,
            phone: branch.phone,
            role: 'admin',
            permissions: PERMS_ADMIN,
            branches: [branch._id],
          });
          await adminUser.save();
        } else {
          // login already exists → regenerate password, attach this branch
          adminUser.password = password;       // re-hashed via pre-save
          adminUser.role = 'admin';
          adminUser.permissions = PERMS_ADMIN;
          adminUser.phone = branch.phone;
          adminUser.isActive = true;
          if (!(adminUser.branches || []).some(b => String(b) === String(branch._id))) {
            adminUser.branches = [...(adminUser.branches || []), branch._id];
          }
          await adminUser.save();
        }
        branch.admin = adminUser._id;
        await branch.save();
        credentials = { login, password, userId: adminUser._id };
        await AuditLog.create({
          user: req.user.id, userName: req.user.name || 'Super admin',
          action: 'create', description: `Club uchun admin login: ${login}`,
          object: branch.name, objectType: 'user', ip: req.ip,
        });
      }
    }

    await AuditLog.create({
      user: req.user.id, userName: req.user.name || 'Admin',
      action: 'create', description: `Yangi club: ${branch.name}`,
      object: branch.name, objectType: 'club', ip: req.ip,
    });

    res.status(201).json({ ...branch.toObject(), credentials });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    if (!req.canAccessBranch(req.params.id)) return res.status(403).json({ message: 'Ruxsat yo\'q' });
    if (req.body.isMain) {
      await Branch.updateMany({ _id: { $ne: req.params.id } }, { isMain: false });
    }
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await AuditLog.create({
      user: req.user.id, userName: req.user.name || 'Admin',
      action: 'update', description: `Club o'zgartirildi: ${branch.name}`,
      object: branch.name, objectType: 'club', ip: req.ip,
    });
    res.json(branch);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Faqat super admin o\'chira oladi' });
    const branch = await Branch.findById(req.params.id);
    if (branch?.isMain) return res.status(400).json({ message: 'Asosiy filialni o\'chirib bo\'lmaydi' });
    await Branch.findByIdAndDelete(req.params.id);
    if (branch) await AuditLog.create({
      user: req.user.id, userName: req.user.name || 'Admin',
      action: 'delete', description: `Club o'chirildi: ${branch.name}`,
      object: branch.name, objectType: 'club', ip: req.ip,
    });
    res.json({ message: 'Filial o\'chirildi' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/reset-admin', async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Faqat super admin' });
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Topilmadi' });
    if (!branch.phone) return res.status(400).json({ message: 'Avval club telefonini kiriting' });

    const login = onlyDigits(branch.phone);
    if (login.length < 7) return res.status(400).json({ message: 'Telefon noto\'g\'ri' });

    const password = genPassword();
    let adminUser = branch.admin ? await User.findById(branch.admin) : await User.findOne({ login });
    if (adminUser) {
      adminUser.password = password;
      adminUser.login = login;
      adminUser.phone = branch.phone;
      adminUser.role = 'admin';
      adminUser.permissions = PERMS_ADMIN;
      if (!adminUser.branches?.some(b => String(b) === String(branch._id))) {
        adminUser.branches = [...(adminUser.branches || []), branch._id];
      }
      adminUser.isActive = true;
      await adminUser.save();
    } else {
      adminUser = await new User({
        name: branch.ownerName || branch.name || 'Admin',
        surname: 'Club admin',
        login,
        password,
        phone: branch.phone,
        role: 'admin',
        permissions: PERMS_ADMIN,
        branches: [branch._id],
      }).save();
    }
    branch.admin = adminUser._id;
    await branch.save();

    await AuditLog.create({
      user: req.user.id, userName: req.user.name || 'Super admin',
      action: 'update', description: `Club admin paroli yangilandi: ${login}`,
      object: branch.name, objectType: 'user', ip: req.ip,
    });

    res.json({ credentials: { login, password, userId: adminUser._id } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
