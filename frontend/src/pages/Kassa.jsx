import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Minus, Trash2, CreditCard, Banknote, UserCheck,
  Calculator, ShoppingBag, Tag, ChevronRight, X, User,
  History, Wifi, Receipt, Check, CheckCircle2, Camera,
  LogOut, Wallet,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../utils/api';
import { formatMoney } from '../utils/format';
import Modal from '../components/Modal';
import QRScannerModal from '../components/QRScannerModal';
import { useBranch } from '../context/BranchContext';
import { useTariffs } from '../context/TariffsContext';

function timeHM(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}


function AttendanceEntry({ rec }) {
  const c = rec.customer;
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-emerald-100 bg-emerald-50/40">
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
          {c?.photo
            ? <img src={c.photo} alt="" className="w-full h-full object-cover" />
            : <span className="text-slate-500 font-bold text-sm">{c?.name?.[0] || '?'}{c?.surname?.[0] || ''}</span>
          }
        </div>
        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-emerald-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 text-sm truncate">{c ? `${c.name} ${c.surname}` : '—'}</div>
            <div className="text-xs text-slate-400 truncate">{c?.customerId ? `ID: ${c.customerId}` : ''}</div>
          </div>
          <span className="text-[11px] text-slate-400 whitespace-nowrap">{timeHM(rec.time)}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-wide bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">KELDI</span>
          {rec.source === 'qr' && <span className="text-[10px] text-slate-400">QR</span>}
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
  const [attendance, setAttendance] = useState([]);
  const [attSearch, setAttSearch] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [justArrived, setJustArrived] = useState(null);
  const [marking, setMarking] = useState(null);
  const [leaving, setLeaving] = useState(null);
  const [debtPayModal, setDebtPayModal] = useState(null); // { customer }
  const [debtPayMethod, setDebtPayMethod] = useState('cash');
  const [debtPayAmount, setDebtPayAmount] = useState('');
  const [debtPayLoading, setDebtPayLoading] = useState(false);

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
      const [c, p, a] = await Promise.all([
        api.get('/customers'),
        api.get('/products'),
        api.get(`/attendance/today${branchParam}`),
      ]);
      setCustomers(c.data);
      setProducts(p.data);
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

  const markLeft = async (customer, attId) => {
    setLeaving(customer._id);
    try {
      await api.delete(`/attendance/${attId}`);
      setAttendance(prev => prev.filter(r => r._id !== attId));
      toast(`${customer.name} ketdi`);
    } catch { toast.error('Xato'); }
    finally { setLeaving(null); }
  };

  const openDebtPay = (customer) => {
    setDebtPayModal({ customer });
    setDebtPayAmount(String(customer.debt));
    setDebtPayMethod('cash');
  };

  const handleDebtPay = async () => {
    const amount = Number(debtPayAmount);
    if (!amount || amount <= 0) { toast.error('Summa kiriting'); return; }
    setDebtPayLoading(true);
    try {
      const res = await api.post(`/customers/${debtPayModal.customer._id}/pay-debt`, { amount, paymentMethod: debtPayMethod });
      toast.success(`${formatMoney(res.data.paid)} to'landi`);
      setDebtPayModal(null);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Xato'); }
    finally { setDebtPayLoading(false); }
  };

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
      {/* ====  Two-column: Bugungi tashriflar (left) + Kirish Lenta (right)  ==== */}
      <div className="grid grid-cols-12 gap-5" style={{ minHeight: 520 }}>

        {/* LEFT — Bugungi tashriflar */}
        <section className="col-span-12 lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
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
            <div className="ml-auto flex items-center gap-2 flex-1 max-w-xs min-w-[160px]">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={attSearch}
                  onChange={e => setAttSearch(e.target.value)}
                  placeholder="Qidirish..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-accent outline-none"
                />
                {attSearch && (
                  <button onClick={() => setAttSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setScannerOpen(true)}
                className="flex items-center gap-1.5 bg-sidebar hover:bg-sidebar-hover text-white px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors"
              >
                <Camera size={14} /> QR
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {attendanceList.map(c => {
              const att = attendanceMap[c._id];
              const flashed = justArrived?.customer?._id === c._id;
              return (
                <div
                  key={c._id}
                  className={`relative border rounded-xl p-3 transition-all
                    ${att ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'}
                    ${flashed ? 'ring-2 ring-accent ring-offset-2 animate-pulse' : ''}`}
                >
                  {/* Photo + name */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                        {c.photo
                          ? <img src={c.photo} alt="" className="w-full h-full object-cover" />
                          : <span className="text-slate-600 font-bold text-[10px]">{c.name[0]}{c.surname?.[0]}</span>
                        }
                      </div>
                      {att && (
                        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center" style={{ width: 14, height: 14 }}>
                          <Check size={8} className="text-white" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-[11px] leading-tight truncate">{c.name} {c.surname}</div>
                      {c.debt > 0 && (
                        <div className="text-[10px] text-rose-500 font-bold">{formatMoney(c.debt)} qarz</div>
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="space-y-1 mb-2">
                    {att ? (
                      <>
                        <div className="w-full bg-emerald-500 text-white text-[10px] font-bold py-1 rounded-lg flex items-center justify-center gap-1">
                          <Check size={10} /> Keldi · {timeHM(att.time)}
                        </div>
                        <button
                          onClick={() => markLeft(c, att._id)}
                          disabled={leaving === c._id}
                          className="w-full bg-white border border-orange-200 hover:bg-orange-500 hover:text-white text-orange-500 text-[10px] font-semibold py-1 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <LogOut size={10} /> Ketti
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => markAttendance(c)}
                        disabled={marking === c._id}
                        className="w-full bg-white border border-slate-200 hover:border-accent hover:bg-accent hover:text-white text-slate-700 text-[10px] font-semibold py-1 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <Plus size={10} /> Keldi
                      </button>
                    )}
                    {c.debt > 0 && (
                      <button
                        onClick={() => openDebtPay(c)}
                        className="w-full bg-rose-50 border border-rose-200 hover:bg-rose-500 hover:text-white text-rose-600 text-[10px] font-semibold py-1 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Wallet size={10} /> Qarz to'lash
                      </button>
                    )}
                  </div>

                  {/* ID */}
                  <div className="text-[9px] text-slate-400 font-mono text-center mb-1.5">{c.customerId}</div>

                  {/* QR code */}
                  <div className="flex justify-center">
                    <QRCodeSVG
                      value={JSON.stringify({ id: c._id, customerId: c.customerId, name: c.name })}
                      size={72}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                </div>
              );
            })}
            {attendanceList.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400 text-sm">Mijoz topilmadi</div>
            )}
          </div>
        </section>

        {/* RIGHT — Kirish Lenta */}
        <aside className="col-span-12 lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                <History size={17} className="text-orange-500" />
              </span>
              <h3 className="font-bold text-slate-900">Kirish Lenta <span className="text-slate-400 font-normal">(Bugun)</span></h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-600">{attendance.length} ta keldi</span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ONLINE
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {attendance.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Wifi size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Hozircha hech kim kirmagan</p>
              </div>
            ) : (
              [...attendance].sort((a, b) => new Date(b.time) - new Date(a.time)).map(rec => (
                <AttendanceEntry key={rec._id} rec={rec} />
              ))
            )}
          </div>
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
                {loading ? 'Saqlanmoqda...' : paymentMethod === 'debt'
                  ? <>Qarzga yopish <ChevronRight size={15} /></>
                  : <>To'lovni qabul qilish <ChevronRight size={15} /></>}
              </button>
            </div>
          </div>
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

      {/* Qarz to'lash modali */}
      <Modal isOpen={!!debtPayModal} onClose={() => setDebtPayModal(null)} title="Qarzni to'lash" size="sm">
        {debtPayModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                {debtPayModal.customer.photo
                  ? <img src={debtPayModal.customer.photo} alt="" className="w-full h-full object-cover" />
                  : <span className="font-bold text-rose-600 text-sm">{debtPayModal.customer.name[0]}</span>
                }
              </div>
              <div>
                <div className="font-bold text-slate-900">{debtPayModal.customer.name} {debtPayModal.customer.surname}</div>
                <div className="text-xs text-rose-500 font-semibold">Jami qarz: {formatMoney(debtPayModal.customer.debt)}</div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">To'lov miqdori (UZS)</label>
              <input
                type="number"
                value={debtPayAmount}
                onChange={e => setDebtPayAmount(e.target.value)}
                placeholder="Summa"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-accent outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">To'lov turi</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'cash', label: 'Naqd', icon: <Banknote size={15} /> },
                  { key: 'card', label: 'Karta', icon: <CreditCard size={15} /> },
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => setDebtPayMethod(m.key)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-colors
                      ${debtPayMethod === m.key ? 'bg-sidebar text-white border-sidebar' : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'}`}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleDebtPay}
              disabled={debtPayLoading || !debtPayAmount || Number(debtPayAmount) <= 0}
              className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {debtPayLoading ? 'Saqlanmoqda...' : <><Check size={15} /> To'lovni qabul qilish</>}
            </button>
          </div>
        )}
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
