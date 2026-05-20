const express = require('express');
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const q = {};
    if (req.query.action)   q.action = req.query.action;
    if (req.query.userId)   q.user = req.query.userId;
    if (req.query.search)   q.description = { $regex: req.query.search, $options: 'i' };

    const items = await AuditLog.find(q)
      .sort({ createdAt: -1 })
      .limit(Number(req.query.limit) || 200)
      .lean();
    res.json(items);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
