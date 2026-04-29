const router = require('express').Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = {};
    if (from && to) {
      query.createdAt = { $gte: new Date(from), $lte: new Date(to) };
    }
    const sales = await Sale.find(query)
      .populate('customer', 'name surname customerId')
      .populate('cashier', 'name surname')
      .populate('items.product', 'name')
      .populate('tariff', 'name')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { items, tariff, customer, total, paymentMethod, saleType, note, branch } = req.body;

    const sale = new Sale({
      items,
      tariff,
      customer,
      cashier: req.user.id,
      total,
      paymentMethod,
      saleType: saleType || (tariff ? 'tariff' : 'product'),
      note,
      branch: branch || null,
    });

    if (items && items.length > 0) {
      for (const item of items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
      }
    }

    if (customer) {
      if (paymentMethod === 'debt') {
        await Customer.findByIdAndUpdate(customer, { $inc: { debt: total } });
      } else {
        await Customer.findByIdAndUpdate(customer, { $inc: { totalPaid: total } });
      }

      if (tariff) {
        const Tariff = require('../models/Tariff');
        const tariffDoc = await Tariff.findById(tariff);
        if (tariffDoc) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + tariffDoc.duration);
          await Customer.findByIdAndUpdate(customer, {
            activeTariff: { tariff, startDate, endDate, isActive: true }
          });
        }
      }
    }

    await sale.save();
    const populated = await Sale.findById(sale._id)
      .populate('customer', 'name surname customerId')
      .populate('cashier', 'name surname')
      .populate('tariff', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/today', auth, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const sales = await Sale.find({ createdAt: { $gte: start, $lte: end } });
    const total = sales.reduce((sum, s) => sum + s.total, 0);
    res.json({ count: sales.length, total, sales });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
