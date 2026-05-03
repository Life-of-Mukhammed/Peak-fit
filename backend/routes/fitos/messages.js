const router = require('express').Router();
const guard = require('../../middleware/platformAuth');
const Message = require('../../models/PlatformMessage');

router.use(guard);

router.get('/', async (req, res) => {
  const q = {};
  if (req.query.status) q.status = req.query.status;
  if (req.query.from || req.query.to) {
    q.createdAt = {};
    if (req.query.from) q.createdAt.$gte = new Date(req.query.from);
    if (req.query.to)   q.createdAt.$lte = new Date(req.query.to);
  }
  res.json(await Message.find(q).populate('club', 'name').sort({ createdAt: -1 }));
});

router.get('/stats', async (req, res) => {
  const [unread, read, replied] = await Promise.all([
    Message.countDocuments({ status: 'unread' }),
    Message.countDocuments({ status: 'read' }),
    Message.countDocuments({ status: 'replied' }),
  ]);
  res.json({ unread, read, replied, total: unread + read + replied });
});

router.post('/', async (req, res) => {
  const m = await Message.create(req.body);
  res.json(m);
});

router.post('/:id/read', async (req, res) => {
  const m = await Message.findById(req.params.id);
  if (!m) return res.status(404).json({ message: 'Topilmadi' });
  if (m.status === 'unread') m.status = 'read';
  await m.save();
  res.json(m);
});

router.post('/:id/reply', async (req, res) => {
  const { body, by } = req.body;
  const m = await Message.findById(req.params.id);
  if (!m) return res.status(404).json({ message: 'Topilmadi' });
  m.replies.push({ body, by });
  m.status = 'replied';
  await m.save();
  res.json(m);
});

router.delete('/:id', async (req, res) => {
  await Message.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
