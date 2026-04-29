const router = require('express').Router();
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Branch = require('../models/Branch');
const auth = require('../middleware/auth');

// branchId filter helper
function branchFilter(branchId) {
  if (!branchId) return {};
  return { branch: new mongoose.Types.ObjectId(branchId) };
}

router.get('/summary', auth, async (req, res) => {
  try {
    const { branchId } = req.query;
    const bf = branchFilter(branchId);

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [todaySales, monthlySales, activeCustomers, debtors] = await Promise.all([
      Sale.find({ ...bf, createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Sale.find({ ...bf, createdAt: { $gte: monthStart, $lte: monthEnd } }),
      Customer.countDocuments({ ...bf, 'activeTariff.isActive': true }),
      Customer.find({ ...bf, debt: { $gt: 0 } }),
    ]);

    res.json({
      todayTotal:          todaySales.reduce((s, x) => s + x.total, 0),
      monthlyTotal:        monthlySales.reduce((s, x) => s + x.total, 0),
      activeSubscriptions: activeCustomers,
      totalDebt:           debtors.reduce((s, x) => s + x.debt, 0),
      debtorCount:         debtors.length,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/daily', auth, async (req, res) => {
  try {
    const { date, branchId } = req.query;
    const bf = branchFilter(branchId);
    const d = date ? new Date(date) : new Date();
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end   = new Date(d); end.setHours(23, 59, 59, 999);

    const sales = await Sale.find({ ...bf, createdAt: { $gte: start, $lte: end } })
      .populate('customer', 'name surname')
      .populate('cashier', 'name surname')
      .sort({ createdAt: -1 });

    res.json({ total: sales.reduce((s, x) => s + x.total, 0), count: sales.length, sales });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/weekly', auth, async (req, res) => {
  try {
    const { branchId } = req.query;
    const bf = branchFilter(branchId);
    const now = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      const sales = await Sale.find({ ...bf, createdAt: { $gte: start, $lte: end } });
      days.push({ date: d.toISOString().split('T')[0], total: sales.reduce((s, x) => s + x.total, 0), count: sales.length });
    }
    res.json(days);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/monthly', auth, async (req, res) => {
  try {
    const { branchId } = req.query;
    const bf = branchFilter(branchId);
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const sales = await Sale.find({ ...bf, createdAt: { $gte: start, $lte: end } });
      months.push({
        month: start.toLocaleString('uz-UZ', { month: 'long', year: 'numeric' }),
        total: sales.reduce((s, x) => s + x.total, 0),
        count: sales.length,
      });
    }
    res.json(months);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/by-cashier', auth, async (req, res) => {
  try {
    const { from, to, branchId } = req.query;
    const match = {};
    if (from && to) match.createdAt = { $gte: new Date(from), $lte: new Date(to) };
    if (branchId) match.branch = new mongoose.Types.ObjectId(branchId);

    const result = await Sale.aggregate([
      { $match: match },
      { $group: { _id: '$cashier', total: { $sum: '$total' }, count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'cashier' } },
      { $unwind: { path: '$cashier', preserveNullAndEmptyArrays: true } },
      { $project: { total: 1, count: 1, name: { $concat: ['$cashier.name', ' ', '$cashier.surname'] } } },
      { $sort: { total: -1 } },
    ]);
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/analytics', auth, async (req, res) => {
  try {
    const { branchId } = req.query;
    const bf = branchFilter(branchId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [salesThisMonth, salesPrevMonth] = await Promise.all([
      Sale.find({ ...bf, createdAt: { $gte: monthStart } })
        .populate('customer', 'name surname customerId')
        .populate('tariff', 'name'),
      Sale.find({ ...bf, createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } }),
    ]);

    // Payment breakdown
    const paymentBreakdown = ['cash', 'card', 'debt'].map(method => ({
      method,
      total: salesThisMonth.filter(s => s.paymentMethod === method).reduce((sum, s) => sum + s.total, 0),
      count: salesThisMonth.filter(s => s.paymentMethod === method).length,
    }));

    // Top products
    const productCounts = {};
    salesThisMonth.forEach(s => {
      (s.items || []).forEach(i => {
        const k = i.name || 'Mahsulot';
        productCounts[k] = productCounts[k] || { name: k, quantity: 0, revenue: 0 };
        productCounts[k].quantity += i.quantity;
        productCounts[k].revenue  += i.total;
      });
    });
    const topProducts = Object.values(productCounts).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Top tariffs
    const tariffCounts = {};
    salesThisMonth.filter(s => s.tariff).forEach(s => {
      const k = s.tariff.name;
      tariffCounts[k] = tariffCounts[k] || { name: k, count: 0, revenue: 0 };
      tariffCounts[k].count   += 1;
      tariffCounts[k].revenue += s.total;
    });
    const topTariffs = Object.values(tariffCounts).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Top customers
    const customerCounts = {};
    salesThisMonth.filter(s => s.customer).forEach(s => {
      const k = s.customer._id.toString();
      customerCounts[k] = customerCounts[k] || {
        name: `${s.customer.name} ${s.customer.surname}`,
        customerId: s.customer.customerId,
        count: 0,
        total: 0,
      };
      customerCounts[k].count += 1;
      customerCounts[k].total += s.total;
    });
    const topCustomers = Object.values(customerCounts).sort((a, b) => b.total - a.total).slice(0, 5);

    // Total deltas
    const monthlyTotal = salesThisMonth.reduce((s, x) => s + x.total, 0);
    const prevMonthlyTotal = salesPrevMonth.reduce((s, x) => s + x.total, 0);
    const monthlyDeltaPct = prevMonthlyTotal > 0
      ? ((monthlyTotal - prevMonthlyTotal) / prevMonthlyTotal) * 100
      : (monthlyTotal > 0 ? 100 : 0);

    // New customers this month
    const newCustomersThisMonth = await Customer.countDocuments({
      ...bf,
      createdAt: { $gte: monthStart },
    });

    res.json({
      paymentBreakdown,
      topProducts,
      topTariffs,
      topCustomers,
      monthlyTotal,
      prevMonthlyTotal,
      monthlyDeltaPct,
      transactionCount: salesThisMonth.length,
      newCustomersThisMonth,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Per-branch summary for Filiallar page
router.get('/by-branch', auth, async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true });
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const results = await Promise.all(branches.map(async (b) => {
      const bf = { branch: b._id };
      const [todaySales, monthlySales, activeCustomers, debtors, totalCustomers] = await Promise.all([
        Sale.find({ ...bf, createdAt: { $gte: todayStart, $lte: todayEnd } }),
        Sale.find({ ...bf, createdAt: { $gte: monthStart, $lte: monthEnd } }),
        Customer.countDocuments({ ...bf, 'activeTariff.isActive': true }),
        Customer.find({ ...bf, debt: { $gt: 0 } }),
        Customer.countDocuments(bf),
      ]);
      return {
        _id:         b._id,
        name:        b.name,
        address:     b.address,
        isMain:      b.isMain,
        todayTotal:  todaySales.reduce((s, x) => s + x.total, 0),
        monthlyTotal: monthlySales.reduce((s, x) => s + x.total, 0),
        activeSubscriptions: activeCustomers,
        totalDebt:   debtors.reduce((s, x) => s + x.debt, 0),
        totalCustomers,
      };
    }));

    res.json(results);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
