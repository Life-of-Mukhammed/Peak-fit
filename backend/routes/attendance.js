const router = require('express').Router();
const Attendance = require('../models/Attendance');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const scope = require('../middleware/scope');

router.use(auth, scope);

const today = () => new Date().toISOString().split('T')[0];

router.get('/today', async (req, res) => {
  try {
    const { branchId } = req.query;
    const q = { date: today() };
    if (branchId && req.canAccessBranch(branchId)) {
      q.branch = branchId;
    } else {
      Object.assign(q, req.scopeFilterOrNull('branch'));
    }
    const list = await Attendance.find(q)
      .populate('customer', 'name surname customerId photo phone activeTariff')
      .populate({ path: 'customer', populate: { path: 'activeTariff.tariff', select: 'name' } })
      .sort({ time: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { customerId, source = 'manual' } = req.body;
    let { branch } = req.body;
    if (!customerId) return res.status(400).json({ message: 'customerId kerak' });
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: 'Mijoz topilmadi' });
    if (!req.canAccessBranch(customer.branch)) return res.status(403).json({ message: 'Ruxsat yo\'q' });
    if (!branch && req.scopedBranchIds?.length > 0) branch = req.scopedBranchIds[0];

    let record = await Attendance.findOne({ customer: customerId, date: today() });
    let alreadyMarked = false;
    if (record) {
      alreadyMarked = true;
    } else {
      record = await Attendance.create({
        customer: customerId,
        date: today(),
        scannedBy: req.user.id,
        source,
        branch: branch || null,
      });
    }
    const populated = await Attendance.findById(record._id)
      .populate({
        path: 'customer',
        select: 'name surname customerId photo phone activeTariff',
        populate: { path: 'activeTariff.tariff', select: 'name endDate' },
      });
    res.status(201).json({ attendance: populated, alreadyMarked });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/scan', async (req, res) => {
  try {
    const { payload } = req.body;
    let { branch } = req.body;
    if (!payload) return res.status(400).json({ message: 'payload kerak' });

    let lookup = null;
    try {
      const obj = JSON.parse(payload);
      if (obj.id) lookup = { _id: obj.id };
      else if (obj.customerId) lookup = { customerId: obj.customerId };
    } catch {
      lookup = { customerId: payload.trim() };
    }
    if (!lookup) return res.status(400).json({ message: 'QR formati noto\'g\'ri' });

    const customer = await Customer.findOne(lookup);
    if (!customer) return res.status(404).json({ message: 'Mijoz topilmadi' });
    if (!req.canAccessBranch(customer.branch)) return res.status(403).json({ message: 'Bu mijoz boshqa clubga tegishli' });
    if (!branch && req.scopedBranchIds?.length > 0) branch = req.scopedBranchIds[0];

    let record = await Attendance.findOne({ customer: customer._id, date: today() });
    let alreadyMarked = !!record;
    if (!record) {
      record = await Attendance.create({
        customer: customer._id,
        date: today(),
        scannedBy: req.user.id,
        source: 'qr',
        branch: branch || null,
      });
    }
    const populated = await Attendance.findById(record._id)
      .populate({
        path: 'customer',
        select: 'name surname customerId photo phone activeTariff',
        populate: { path: 'activeTariff.tariff', select: 'name endDate' },
      });
    res.json({ attendance: populated, alreadyMarked });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const rec = await Attendance.findById(req.params.id);
    if (!rec) return res.status(404).json({ message: 'Tashrif topilmadi' });
    if (!req.canAccessBranch(rec.branch)) return res.status(403).json({ message: 'Ruxsat yo\'q' });
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tashrif o\'chirildi' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
