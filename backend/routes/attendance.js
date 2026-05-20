const router = require('express').Router();
const Attendance = require('../models/Attendance');
const Customer = require('../models/Customer');
const auth = require('../middleware/clubAuth');

const today = () => new Date().toISOString().split('T')[0];

router.get('/today', auth, async (req, res) => {
  try {
    const { branchId } = req.query;
    const q = { club: req.user.club, date: today() };
    if (branchId) q.branch = branchId;
    const list = await Attendance.find(q)
      .populate('customer', 'name surname customerId photo phone activeTariff')
      .populate({ path: 'customer', populate: { path: 'activeTariff.tariff', select: 'name' } })
      .sort({ time: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { customerId, source = 'manual', branch = null } = req.body;
    if (!customerId) return res.status(400).json({ message: 'customerId kerak' });

    const customer = await Customer.findOne({ _id: customerId, club: req.user.club });
    if (!customer) return res.status(404).json({ message: 'Mijoz topilmadi' });

    let record = await Attendance.findOne({ customer: customerId, date: today() });
    let alreadyMarked = false;
    if (record) {
      alreadyMarked = true;
    } else {
      record = await Attendance.create({
        club: req.user.club,
        customer: customerId,
        date: today(),
        scannedBy: req.user.id,
        source,
        branch,
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

router.post('/scan', auth, async (req, res) => {
  try {
    const { payload, branch = null } = req.body;
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

    const customer = await Customer.findOne({ ...lookup, club: req.user.club });
    if (!customer) return res.status(404).json({ message: 'Mijoz topilmadi' });

    let record = await Attendance.findOne({ customer: customer._id, date: today() });
    let alreadyMarked = !!record;
    if (!record) {
      record = await Attendance.create({
        club: req.user.club,
        customer: customer._id,
        date: today(),
        scannedBy: req.user.id,
        source: 'qr',
        branch,
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

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Attendance.findOneAndDelete({ _id: req.params.id, club: req.user.club });
    if (!result) return res.status(404).json({ message: 'Tashrif topilmadi' });
    res.json({ message: 'Tashrif o\'chirildi' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
