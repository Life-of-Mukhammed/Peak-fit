import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Minus, Trash2, CreditCard, Banknote, UserCheck,
  Calculator, ShoppingBag, Tag, ChevronRight, X, User,
  History, Filter, ChevronLeft, AlertTriangle,
  Wifi, Receipt, ScanLine, Check, CheckCircle2, Camera,
} from 'lucide-react';
import api from '../utils/api';
import { formatMoney } from '../utils/format';
import Modal from '../components/Modal';
import QRScannerModal from '../components/QRScannerModal';
import { useBranch } from '../context/BranchContext';
import { useTariffs } from '../context/TariffsContext';

const PAGE_SIZE = 6;

function customerStatus(c) {
  if (c.frozen) return 'frozen';
  const t = c.activeTariff;
  if (t?.isActive && t.endDate && new Date(t.endDate) > new Date()) return 'active';
  return 'expired';
}

function timeHM(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

function StatusPill({ kind }) {
  const cfg = {
    active:  { label: 'AKTIV',           dot: 'bg-emerald-500', bg: 'bg-emerald-50',  fg: 'text-emerald-700' },
    frozen:  { label: 'MUZLATILGAN',     dot: 'bg-amber-500',   bg: 'bg-amber-50',    fg: 'text-amber-700' },
    expired: { label: "MUDDATI O'TGAN",  dot: 'bg-rose-500',    bg: 'bg-rose-50',     fg: 'text-rose-700' },
  }[kind] || { label: '—', dot: 'bg-slate-300', bg: 'bg-slate-100', fg: 'text-slate-500' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${cfg.bg} ${cfg.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function FeedEntry({ sale }) {
  const c = sale.customer;
  const isDebt = sale.paymentMethod === 'debt';
  const planName = sale.tariff?.name || sale.items?.[0]?.name || 'Sotuv';
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors
      ${isDebt ? 'border-rose-100 bg-rose-50/40' : 'border-slate-100 hover:bg-slate-50'}`}>
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
          {c?.photo
            ? <img src={c.photo} alt="" className="w-full h-full object-cover" />
            : <span className="text-slate-500 font-bold text-sm">{c?.name?.[0] || '?'}{c?.surname?.[0] || ''}</span>
          }
        </div>
        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white
          ${isDebt ? 'bg-rose-500' : 'bg-emerald-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 text-sm truncate">{c ? `${c.name} ${c.surname}` : 'Mijozsiz'}</div>
            <div className="text-xs text-slate-400 truncate">
              {c?.customerId ? `ID: ${c.customerId} · ` : ''}{planName}
            </div>
          </div>
          <span className="text-[11px] text-slate-400 whitespace-nowrap">{timeHM(sale.createdAt)}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          {isDebt ? (
            <span className="text-[10px] font-bold tracking-wide bg-rose-500 text-white px-2 py-0.5 rounded">QARZ</span>
          ) : (
            <span className="text-[10px] font-bold tracking-wide bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">RUXSAT BERILDI</span>
          )}
          <span className="text-[11px] text-slate-400">{formatMoney(sale.total)}</span>
        </div>
      </div>
    </div>
  );
}

export default function Kassa() {
  const navigate = useNavigate();
  const { selected: selectedBranch } = useBranch();
  const { tariffs } = useTariffs();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [attendance, setAttendance] = useState([]);    // today's attendance records
  const [attSearch, setAttSearch] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [justArrived, setJustArrived] = useState(null); // post-scan flash
  const [marking, setMarking] = useState(null);         // customerId being marked

  const [tab, setTab] = useState('all');             // all | debtors | archive
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Register (always-visible inline section)
  const [cart, setCart] = useState([]);
  const [regTab, setRegTab] = useState('products');
  const [regSearch, setRegSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [debtSearch, setDebtSearch] = useState('');
  const [debtCustomers, setDebtCustomers] = useState([]);
  const [debtLoading, setDebtLoading] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [calcValue, setCalcValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchAll(); }, [selectedBranch?._id]);

  // Listen for QR-scanner event from header
  useEffect(() => {
    const onOpen = () => setScannerOpen(true);
    window.addEventListener('peak:open-scanner', onOpen);
    return () => window.removeEventListener('peak:open-scanner', onOpen);
  }, []);

  const fetchAll = async () => {
    try {
      const branchParam = selectedBranch?._id ? `?branchId=${selectedBranch._id}` : '';
      const [c, p, s, a] = await Promise.all([
        api.get('/customers'),
        api.get('/products'),
        api.get('/sales'),
        api.get(`/attendance/today${branchParam}`),
      ]);
      setCustomers(c.data);
      setProducts(p.data);
      setRecentSales(s.data.slice(0, 30));
      setAttendance(a.data);
    } catch { /* silent */ }
  };

  // Map of customerId → attendance record (for fast lookup)
  const attendanceMap = useMemo(() => {
    const m = {};
    for (const r of attendance) if (r.customer?._id) m[r.customer._id] = r;
    return m;
  }, [attendance]);

  const markAttendance = async (customer, source = 'manual') => {
    setMarking(customer._id);
    try {
      const res = await api.post('/attendance', {
        customerId: customer._id,
        source,
        branch: selectedBranch?._id || null,
      });
      const { attendance: rec, alreadyMarked } = res.data;
      setAttendance(prev => {
        const others = prev.filter(x => x.customer?._id !== customer._id);
        return [rec, ...others];
      });
      if (alreadyMarked) toast(`✓ ${customer.name} bugun allaqachon kelgan`, { icon: '👋' });
      else toast.success(`${customer.name} keldi deb belgilandi`);
      setJustArrived(rec);
      setTimeout(() => setJustArrived(null), 2400);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xato');
    } finally { setMarking(null); }
  };

  const handleScan = async (payload) => {
    try {
      const res = await api.post('/attendance/scan', {
        payload,
        branch: selectedBranch?._id || null,
      });
      const { attendance: rec, alreadyMarked } = res.data;
      setAttendance(prev => {
        const others = prev.filter(x => x.customer?._id !== rec.customer._id);
        return [rec, ...others];
      });
      const name = rec.customer?.name || '';
      if (alreadyMarked) toast(`👋 ${name} allaqachon kelgan`);
      else toast.success(`✓ ${name} keldi (QR)`);
      setJustArrived(rec);
      setTimeout(() => setJustArrived(null), 2400);
      // Auto-close scanner after a successful scan
      setScannerOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'QR xato');
      setScannerOpen(false);
    }
  };

  // ----- Filters / pagination -----
  const filteredCustomers = useMemo(() => {
    let list = customers;
    if (tab === 'debtors') list = list.filter(c => c.debt > 0);
    if (tab === 'archive') list = list.filter(c => customerStatus(c) !== 'active');
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(c =>
        `${c.name} ${c.surname} ${c.phone || ''} ${c.customerId || ''}`.toLowerCase().includes(s)
      );
    }
    return list;
  }, [customers, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const pageItems = filteredCustomers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [tab, search]);

  const tabCounts = useMemo(() => ({
    all: customers.length,
    debtors: customers.filter(c => c.debt > 0).length,
    archive: customers.filter(c => customerStatus(c) !== 'active').length,
  }), [customers]);

  // ----- Register modal handlers -----
  useEffect(() => {
    if (!showDebtModal) return;
    const load = async () => {
      setDebtLoading(true);
      try {
        const res = await api.get(`/customers?search=${debtSearch}`);
        setDebtCustomers(res.data.slice(0, 20));
      } catch { }
      finally { setDebtLoading(false); }
    };
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [debtSearch, showDebtModal]);

  const regList = regTab === 'products'
    ? products.filter(p => p.name.toLowerCase().includes(regSearch.toLowerCase()) || p.barcode?.includes(regSearch))
    : tariffs.filter(t => t.name.toLowerCase().includes(regSearch.toLowerCase()));

  const addToCart = (item, type = 'product') => {
    setCart(prev => {
      const existing = prev.find(c => c._id === item._id && c.type === type);
      if (existing) return prev.map(c => c._id === item._id && c.type === type ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1, type }];
    });
  };

  const updateQty = (id, type, delta) => {
    setCart(prev => prev.map(c => c._id === id && c.type === type ? { ...c, quantity: c.quantity + delta } : c).filter(c => c.quantity > 0));
  };

  const total = cart.reduce((s, item) => s + (item.salePrice || item.price) * item.quantity, 0);

  const handlePaymentMethodClick = (method) => {
    setPaymentMethod(method);
    if (method === 'debt') { setShowDebtModal(true); setDebtSearch(''); }
  };

  const handleSell = async () => {
    if (cart.length === 0) { toast.error('Savat bo\'sh'); return; }
    if (paymentMethod === 'debt' && !selectedCustomer) { toast.error('Qarzga yozish uchun mijoz tanlang'); setShowDebtModal(true); return; }
    setLoading(true);
    try {
      const productItems = cart.filter(c => c.type === 'product').map(c => ({
        product: c._id, name: c.name, quantity: c.quantity, price: c.salePrice, total: c.salePrice * c.quantity
      }));
      const tariffItem = cart.find(c => c.type === 'tariff');
      await api.post('/sales', {
        items: productItems,
        tariff: tariffItem?._id,
        customer: selectedCustomer?._id,
        total,
        paymentMethod,
        saleType: tariffItem ? 'tariff' : 'product',
        branch: selectedBranch?._id || null,
      });
      toast.success('Sotuv muvaffaqiyatli amalga oshirildi!');
      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod('cash');
      window.dispatchEvent(new CustomEvent('peak:sale-completed'));
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Xato'); }
    finally { setLoading(false); }
  };

  const calcPress = (val) => {
    if (val === 'C') { setCalcValue(''); return; }
    if (val === '=') {
      try { setCalcValue(String(Number(Function('"use strict"; return (' + calcValue + ')')().toFixed(10)))); }
      catch { setCalcValue('Xato'); }
      return;
    }
    if (val === '⌫') { setCalcValue(v => v.slice(0, -1)); return; }
    setCalcValue(v => v + val);
  };

  // Customers filtered for the bottom attendance grid (search-driven)
  const attendanceList = useMemo(() => {
    if (!attSearch.trim()) return customers;
    const s = attSearch.toLowerCase();
    return customers.filter(c =>
      `${c.name} ${c.surname} ${c.phone || ''} ${c.customerId || ''}`.toLowerCase().includes(s)
    );
  }, [customers, attSearch]);

  const attendedCount = attendance.length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-12 gap-5">
      {/* ======================  LEFT — Mijozlar Bazasi  ====================== */}
      <section className="col-span-12 lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        {/* Header row */}
        <div className="px-5 py-4 flex items-center gap-4 flex-wrap border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 leading-tight">
            Mijozlar<br />Bazasi
          </h2>

          {/* Tabs */}
          <div className="flex bg-slate-100 rounded-xl p-1 ml-auto md:ml-0">
            {[
              { key: 'all',     label: 'Barchasi' },
              { key: 'debtors', label: 'Qarzdorlar' },
              { key: 'archive', label: 'Arxiv' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all
                  ${tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t.label}
                {tabCounts[t.key] > 0 && (
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold
                    ${tab === t.key ? 'bg-accent/15 text-accent-dark' : 'bg-slate-200 text-slate-500'}`}>
                    {tabCounts[t.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Right summary */}
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Jami<br />mijozlar</div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{customers.length.toLocaleString('uz-UZ')}</div>
            <button className="p-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-500 hover:text-slate-700 transition-colors">
              <Filter size={16} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/40">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Mijoz qidirish: ism, telefon, ID..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-slate-50/60 sticky top-0">
              <tr>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Rasm / Mijoz</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Telefon raqam</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status / Tarif</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Qarzdorlik</th>
                <th className="text-center px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Bugun</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map(c => {
                const status = customerStatus(c);
                return (
                  <tr key={c._id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {c.photo
                            ? <img src={c.photo} alt="" className="w-full h-full object-cover" />
                            : <span className="text-slate-600 font-bold text-xs">{c.name[0]}{c.surname?.[0]}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => navigate(`/mijozlar`)}
                            className="font-bold text-slate-900 hover:text-accent text-[15px] truncate text-left"
                          >
                            {c.name} {c.surname}
                          </button>
                          <div className="text-xs text-slate-400 font-mono">ID: {c.customerId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">{c.phone || '—'}</td>
                    <td className="px-4 py-3.5">
                      <StatusPill kind={status} />
                      <div className="text-xs text-slate-500 mt-1">{c.activeTariff?.tariff?.name || '—'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {c.debt > 0
                        ? <span className="font-bold text-rose-500 text-[15px] tabular-nums">{formatMoney(c.debt)}</span>
                        : <span className="text-slate-400 text-sm">0 UZS</span>
                      }
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {attendanceMap[c._id] ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <Check size={12} /> Keldi · {timeHM(attendanceMap[c._id].time)}
                        </span>
                      ) : (
                        <button
                          onClick={() => markAttendance(c)}
                          disabled={marking === c._id}
                          className="inline-flex items-center gap-1 bg-white border border-slate-200 hover:border-accent hover:bg-accent/5 hover:text-accent-dark text-slate-700 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors disabled:opacity-50"
                        >
                          <Plus size={12} /> Keldi
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-slate-400">
                    <User size={36} className="mx-auto mb-2 opacity-30" />
                    Mijozlar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
          <div className="text-xs text-slate-400 uppercase tracking-wide">
            {filteredCustomers.length === 0 ? '0' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredCustomers.length)}`} dan {filteredCustomers.length.toLocaleString('uz-UZ')} ta mijoz ko'rsatilmoqda
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors
                    ${page === p ? 'bg-orange-500 text-white shadow-md' : 'border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ======================  RIGHT — Kirish Lenta (Live)  ====================== */}
      <aside className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <History size={17} className="text-orange-500" />
            </span>
            <h3 className="font-bold text-slate-900">Kirish Lenta <span className="text-slate-400 font-normal">(Live)</span></h3>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ONLINE
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {recentSales.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Wifi size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Hozircha hech kim kirmagan</p>
            </div>
          ) : recentSales.map(s => <FeedEntry key={s._id} sale={s} />)}
        </div>

        <button
          onClick={() => navigate('/hisobotlar')}
          className="border-t border-slate-100 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Barchasini ko'rish
        </button>
      </aside>
      </div>

      {/* ======================  SOTUV MARKAZI (inline register)  ====================== */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Receipt size={18} className="text-accent" />
          </span>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900">Sotuv markazi</h3>
            <p className="text-xs text-slate-500">Mahsulot va tariflarni tanlab, savatga qo'shing</p>
          </div>
          <button onClick={() => setShowCalc(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold text-slate-700 transition-colors">
            <Calculator size={14} /> Kalkulator
          </button>
        </div>

        <div className="grid grid-cols-12 gap-0">
          {/* Items column */}
          <div className="col-span-12 lg:col-span-8 p-5 border-b lg:border-b-0 lg:border-r border-slate-100">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button
                onClick={() => setRegTab('products')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${regTab === 'products' ? 'bg-sidebar text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <ShoppingBag size={15} /> Mahsulotlar
              </button>
              <button
                onClick={() => setRegTab('tariffs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${regTab === 'tariffs' ? 'bg-sidebar text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <Tag size={15} /> Tariflar
              </button>
              <div className="relative flex-1 min-w-[180px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={regSearch} onChange={e => setRegSearch(e.target.value)} placeholder={regTab === 'products' ? 'Mahsulot nomi...' : 'Tarif nomi...'} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-accent outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-80 overflow-y-auto pr-1">
              {regTab === 'products' && regList.map(p => (
                <button
                  key={p._id}
                  onClick={() => { if (p.quantity <= 0) { toast.error('Qoldiq yo\'q'); return; } addToCart(p, 'product'); }}
                  className="text-left p-2.5 border border-slate-200 rounded-xl hover:border-accent hover:bg-accent/5 transition-all"
                >
                  <div className="w-full h-16 bg-slate-100 rounded-lg mb-1.5 overflow-hidden flex items-center justify-center">
                    {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <ShoppingBag size={20} className="text-slate-300" />}
                  </div>
                  <div className="font-medium text-xs text-slate-800 truncate">{p.name}</div>
                  <div className="text-accent font-semibold text-xs">{formatMoney(p.salePrice)}</div>
                  <div className={`text-[10px] ${p.quantity <= 5 ? 'text-rose-500' : 'text-slate-400'}`}>Qoldiq: {p.quantity}</div>
                </button>
              ))}
              {regTab === 'tariffs' && regList.map(t => (
                <button
                  key={t._id}
                  onClick={() => { if (cart.some(c => c.type === 'tariff')) { toast.error('Faqat 1 ta tarif'); return; } addToCart(t, 'tariff'); }}
                  className="text-left p-3 border border-slate-200 rounded-xl hover:border-accent hover:bg-accent/5 transition-all"
                >
                  <div className="font-semibold text-slate-800 text-sm truncate">{t.name}</div>
                  <div className="text-accent font-bold">{formatMoney(t.price)}</div>
                  <div className="text-slate-400 text-xs">{t.duration} kun</div>
                </button>
              ))}
              {regList.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-400 text-sm">Topilmadi</div>
              )}
            </div>
          </div>

          {/* Cart column */}
          <div className="col-span-12 lg:col-span-4 p-5 bg-slate-50/40 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ShoppingBag size={14} className="text-accent" /> Savat
              </h4>
              {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-rose-500 hover:text-rose-700">Tozalash</button>}
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[140px] max-h-60">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <ShoppingBag size={28} className="mx-auto mb-1.5 opacity-30" />
                  Savat bo'sh
                </div>
              ) : cart.map(item => (
                <div key={`${item._id}-${item.type}`} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{item.name}</div>
                    <div className="text-accent text-[10px] font-semibold">{formatMoney((item.salePrice || item.price) * item.quantity)}</div>
                  </div>
                  {item.type === 'product' ? (
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => updateQty(item._id, item.type, -1)} className="w-5 h-5 flex items-center justify-center bg-slate-100 rounded hover:bg-slate-200"><Minus size={11} /></button>
                      <span className="w-5 text-center text-xs font-medium">{item.quantity}</span>
                      <button onClick={() => updateQty(item._id, item.type, 1)} className="w-5 h-5 flex items-center justify-center bg-slate-100 rounded hover:bg-slate-200"><Plus size={11} /></button>
                    </div>
                  ) : (
                    <span className="text-[10px] bg-accent/15 text-accent-dark px-1.5 py-0.5 rounded font-medium">Tarif</span>
                  )}
                  <button onClick={() => setCart(prev => prev.filter(c => !(c._id === item._id && c.type === item.type)))} className="text-rose-400 hover:text-rose-600">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 mt-2 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-700 text-sm">Jami:</span>
                <span className="text-accent text-base">{formatMoney(total)}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'cash', label: 'Naqd', icon: <Banknote size={12} /> },
                  { key: 'card', label: 'Karta', icon: <CreditCard size={12} /> },
                  { key: 'debt', label: 'Qarz',  icon: <UserCheck size={12} /> },
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => handlePaymentMethodClick(m.key)}
                    className={`flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-semibold border transition-colors
                      ${paymentMethod === m.key ? 'bg-sidebar text-white border-sidebar' : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'}`}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>

              {selectedCustomer && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1.5">
                  <User size={12} className="text-emerald-700" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-emerald-800 truncate">{selectedCustomer.name} {selectedCustomer.surname}</div>
                  </div>
                  <button onClick={() => { setSelectedCustomer(null); setPaymentMethod('cash'); }} className="text-emerald-500 hover:text-rose-500">
                    <X size={12} />
                  </button>
                </div>
              )}

              <button
                onClick={handleSell}
                disabled={loading || cart.length === 0}
                className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 text-sm"
              >
                {loading ? 'Saqlanmoqda...' : <>To'lovni qabul qilish <ChevronRight size={15} /></>}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================  ATTENDANCE GRID — "Bugungi tashriflar"  ====================== */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-500" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900">Bugungi tashriflar</h3>
              <p className="text-xs text-slate-500">
                Bugun <span className="font-semibold text-emerald-600">{attendedCount}</span> / {customers.length} ta mijoz keldi
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 flex-1 max-w-md min-w-[180px]">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={attSearch}
                onChange={e => setAttSearch(e.target.value)}
                placeholder="Mijoz qidirish..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-accent outline-none"
              />
            </div>
            <button
              onClick={() => setScannerOpen(true)}
              className="flex items-center gap-1.5 bg-sidebar hover:bg-sidebar-hover text-white px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors"
            >
              <Camera size={14} /> QR-skaner
            </button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[440px] overflow-y-auto">
          {attendanceList.map(c => {
            const att = attendanceMap[c._id];
            const flashed = justArrived?.customer?._id === c._id;
            return (
              <div
                key={c._id}
                className={`relative border rounded-xl p-3 transition-all
                  ${att
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'}
                  ${flashed ? 'ring-2 ring-accent ring-offset-2 animate-pulse' : ''}`}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {c.photo
                        ? <img src={c.photo} alt="" className="w-full h-full object-cover" />
                        : <span className="text-slate-600 font-bold text-xs">{c.name[0]}{c.surname?.[0]}</span>
                      }
                    </div>
                    {att && (
                      <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center" style={{ width: 18, height: 18 }}>
                        <Check size={10} className="text-white" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-xs truncate">{c.name} {c.surname}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{c.customerId}</div>
                  </div>
                </div>

                {att ? (
                  <div className="w-full bg-emerald-500 text-white text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1">
                    <Check size={12} /> Keldi · {timeHM(att.time)}
                  </div>
                ) : (
                  <button
                    onClick={() => markAttendance(c)}
                    disabled={marking === c._id}
                    className="w-full bg-white border border-slate-200 hover:border-accent hover:bg-accent hover:text-white text-slate-700 text-xs font-semibold py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <Plus size={12} /> Keldi
                  </button>
                )}
              </div>
            );
          })}
          {attendanceList.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400 text-sm">
              Mijoz topilmadi
            </div>
          )}
        </div>
      </section>

      {/* Debt customer picker */}
      <Modal isOpen={showDebtModal} onClose={() => setShowDebtModal(false)} title="Qarz uchun mijoz tanlash" size="md">
        <div className="space-y-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={debtSearch} onChange={e => setDebtSearch(e.target.value)} autoFocus
              placeholder="Ism, telefon yoki ID..." className="input pl-9" />
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {debtLoading ? (
              <div className="text-center py-8 text-slate-400 text-sm">Qidirilmoqda...</div>
            ) : debtCustomers.length === 0 ? (
              <div className="text-center py-8 text-slate-400">Mijoz topilmadi</div>
            ) : debtCustomers.map(c => (
              <button
                key={c._id}
                onClick={() => { setSelectedCustomer(c); setShowDebtModal(false); }}
                className="w-full flex items-center gap-3 p-3 hover:bg-accent/5 hover:border-accent border border-transparent rounded-xl transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center overflow-hidden">
                  {c.photo
                    ? <img src={c.photo} alt="" className="w-full h-full object-cover" />
                    : <span className="text-accent-dark font-bold text-sm">{c.name[0]}{c.surname?.[0]}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900">{c.name} {c.surname}</div>
                  <div className="text-xs text-slate-400">{c.customerId} · {c.phone || '—'}</div>
                </div>
                {c.debt > 0 && <span className="text-xs text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full font-medium">{formatMoney(c.debt)}</span>}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Calculator */}
      <Modal isOpen={showCalc} onClose={() => setShowCalc(false)} title="Kalkulator" size="sm">
        <div className="space-y-3">
          <div className="bg-slate-900 text-white text-right p-4 rounded-xl text-2xl font-mono min-h-16 break-all">{calcValue || '0'}</div>
          <div className="grid grid-cols-4 gap-2">
            {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','C','(',')', '⌫'].map(k => (
              <button key={k} onClick={() => calcPress(k)}
                className={`py-3 rounded-lg font-medium text-lg transition-colors
                  ${k === '=' ? 'bg-accent text-white' : k === 'C' ? 'bg-rose-100 text-rose-600' : k === '⌫' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 hover:bg-slate-200'}`}>
                {k}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* QR scanner */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onResult={handleScan}
      />

      {/* Just-arrived flash banner */}
      {justArrived && (
        <div className="fixed bottom-6 right-6 z-[90] bg-white border border-emerald-200 shadow-2xl rounded-2xl p-4 min-w-[280px] animate-[slideUp_0.3s_ease]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <Check size={26} className="text-white" strokeWidth={3} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-emerald-600 font-bold">Ruxsat berildi</div>
              <div className="font-bold text-slate-900 truncate">{justArrived.customer?.name} {justArrived.customer?.surname}</div>
              <div className="text-xs text-slate-500 font-mono">{justArrived.customer?.customerId} · {timeHM(justArrived.time)}</div>
            </div>
          </div>
          <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
      )}
    </div>
  );
}
