// Branch-scoping middleware. Run AFTER `auth` middleware.
// - For superadmin: no scoping (sees everything).
// - For others: scopes to user.branches[] (loaded fresh from DB).
//
// Exposes on req:
//   req.fullUser              — current user document (lean)
//   req.scopedBranchIds       — null (superadmin) | array of branch ObjectIds (others)
//   req.scopeFilter(key)      — query fragment to spread into Mongo find()
//                                 superadmin   → {}
//                                 has branches → { [key]: { $in: ids } }
//                                 no branches  → { _id: null }  (matches nothing)
//   req.scopeFilterOrNull(k)  — like above but also includes records with key=null
//                                 (useful for legacy data without a branch)
//   req.canAccessBranch(id)   — boolean check for a single branch
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    if (!req.user?.id) return next();
    const u = await User.findById(req.user.id).lean();
    if (!u || u.isActive === false) return res.status(401).json({ message: 'Foydalanuvchi yo\'q yoki bloklangan' });

    req.fullUser = u;
    req.user.role = u.role;
    req.user.name = u.name;
    req.user.surname = u.surname;

    if (u.role === 'superadmin') {
      req.scopedBranchIds = null;
    } else {
      req.scopedBranchIds = (u.branches || []).map(b => String(b));
    }

    req.scopeFilter = (key = 'branch') => {
      if (req.scopedBranchIds === null) return {};
      if (req.scopedBranchIds.length === 0) return { _id: null };
      return { [key]: { $in: req.scopedBranchIds } };
    };

    // STRICT: only records with key ∈ scopedBranchIds.
    // Legacy null-branch records are NOT visible to non-super-admins.
    // Use this for tenant-isolated data: customers, sales, attendance.
    req.scopeFilterOrNull = (key = 'branch') => {
      if (req.scopedBranchIds === null) return {};                  // superadmin sees all (incl. null)
      if (req.scopedBranchIds.length === 0) return { _id: null };   // no branches → nothing
      return { [key]: { $in: req.scopedBranchIds } };
    };

    req.canAccessBranch = (id) => {
      if (req.scopedBranchIds === null) return true;
      if (!id) return true; // legacy null-branch records — admin can also touch them
      return req.scopedBranchIds.includes(String(id));
    };

    next();
  } catch (err) {
    next(err);
  }
};
