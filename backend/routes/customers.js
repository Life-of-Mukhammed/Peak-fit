const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `customer_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { surname: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { customerId: { $regex: search, $options: 'i' } },
        ]
      };
    }
    const customers = await Customer.find(query).populate('activeTariff.tariff').sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('activeTariff.tariff');
    if (!customer) return res.status(404).json({ message: 'Mijoz topilmadi' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, upload.single('photo'), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || '{}');
    const customer = new Customer({
      ...data,
      photo: req.file ? `/uploads/${req.file.filename}` : null,
    });
    await customer.save();

    const qrData = JSON.stringify({ id: customer._id, customerId: customer.customerId, name: customer.name });
    const qrCode = await QRCode.toDataURL(qrData);
    customer.qrCode = qrCode;
    await customer.save();

    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, upload.single('photo'), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || '{}');
    if (req.file) data.photo = `/uploads/${req.file.filename}`;
    const customer = await Customer.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Mijoz o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('activeTariff.tariff');
    if (!customer) return res.status(404).json({ message: 'Mijoz topilmadi' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=customer_${customer.customerId}.pdf`);
    doc.pipe(res);

    doc.fontSize(24).font('Helvetica-Bold').text('PEAK FIT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).font('Helvetica').text('Mijoz ma\'lumotlari', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(12);
    doc.text(`ID: ${customer.customerId}`);
    doc.text(`Ism: ${customer.name} ${customer.surname}`);
    doc.text(`Telefon: ${customer.phone || '-'}`);
    doc.text(`Tug'ilgan sana: ${customer.dob || '-'}`);
    doc.text(`Qarz: ${customer.debt.toLocaleString()} UZS`);

    if (customer.activeTariff?.tariff) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text('Faol tarif:');
      doc.font('Helvetica');
      doc.text(`${customer.activeTariff.tariff.name} - ${customer.activeTariff.tariff.price.toLocaleString()} UZS`);
      doc.text(`Tugash sanasi: ${customer.activeTariff.endDate ? new Date(customer.activeTariff.endDate).toLocaleDateString('uz-UZ') : '-'}`);
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Pay customer debt
router.post('/:id/pay-debt', auth, async (req, res) => {
  try {
    const { amount, paymentMethod = 'cash' } = req.body;
    if (!amount || Number(amount) <= 0) return res.status(400).json({ message: 'Summa kiritilmagan' });
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Mijoz topilmadi' });
    const pay = Math.min(Number(amount), customer.debt);
    await Customer.findByIdAndUpdate(req.params.id, { $inc: { debt: -pay, totalPaid: pay } });
    await Sale.create({
      items: [],
      customer: req.params.id,
      total: pay,
      paymentMethod,
      saleType: 'debt_payment',
      note: 'Qarz to\'lovi',
      cashier: req.user.id,
      branch: customer.branch || null,
    });
    res.json({ paid: pay, remaining: Math.max(0, customer.debt - pay) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
