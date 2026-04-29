import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, Search, Edit2, Trash2, Download, User, AlertCircle,
  CheckCircle2, Phone, Calendar, CreditCard, Banknote, Tag,
  Clock, TrendingUp, X, ChevronRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../utils/api';
import { formatMoney, formatDate } from '../utils/format';
import Modal from '../components/Modal';
import { useBranch } from '../context/BranchContext';

const INITIAL_FORM = { name: '', surname: '', dob: '', phone: '', tariffId: '' };

function calcAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

function saleTypeLabel(t) {
  if (t === 'tariff') return 'Tarif';
  if (t === 'debt_payment') return 'Qarz to\'lovi';
  return 'Mahsulot';
}

function payMethodLabel(m) {
  if (m === 'cash') return 'Naqd';
  if (m === 'card') return 'Karta';
  if (m === 'debt') return 'Qarz';
  return m;
}

export default function Mijozlar() {
  const [customers, setCustomers] = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [successCustomer, setSuccessCustomer] = useState(null);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedSales, setSelectedSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const { selected: selectedBranch } = useBranch();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchCustomers();
    api.get('/tariffs').then(r => setTariffs(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreate();
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
    const initialSearch = searchParams.get('search');
    if (initialSearch) setSearch(initialSearch);
    const handler = () => openCreate();
    window.addEventListener('peak:new-customer', handler);
    return () => window.removeEventListener('peak:new-customer', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch { toast.error('Mijozlarni yuklashda xato'); }
  };

  const filtered = customers.filter(c =>
    `${c.name} ${c.surname} ${c.phone} ${c.customerId}`.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null); setForm(INITIAL_FORM); setPhoto(null); setPhotoPreview(''); setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, surname: c.surname, dob: c.dob || '', phone: c.phone || '', tariffId: c.activeTariff?.tariff?._id || c.activeTariff?.tariff || '' });
    setPhotoPreview(c.photo || '');
    setShowModal(true);
  };

  const openDetail = async (c) => {
    setSelected(c);
    setShowDetail(true);
    setSalesLoading(true);
    setSelectedSales([]);
    try {
      const res = await api.get(`/sales?customerId=${c._id}`);
      setSelectedSales(res.data);
    } catch {} finally { setSalesLoading(false); }
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      const { tariffId, ...rest } = form;
      fd.append('data', JSON.stringify({ ...rest, branch: selectedBranch?._id || null }));
      if (photo) fd.append('photo', photo);
      let savedCustomer;
      if (editing) {
        const res = await api.put(`/customers/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        savedCustomer = res.data;
      } else {
        const res = await api.post('/customers', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        savedCustomer = res.data;
      }
      if (tariffId && savedCustomer?._id) {
        const tariff = tariffs.find(t => t._id === tariffId);
        if (tariff) {
          await api.post('/sales', { tariff: tariffId, customer: savedCustomer._id, total: tariff.price, paymentMethod: 'cash', saleType: 'tariff' });
        }
      }
      setShowModal(false);
      try { const fresh = await api.get(`/customers/${savedCustomer._id}`); setSuccessCustomer(fresh.data); }
      catch { setSuccessCustomer(savedCustomer); }
      fetchCustomers();
    } catch (err) { toast.error(err.response?.data?.message || 'Xato'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Mijozni o\'chirishni tasdiqlaysizmi?')) return;
    try { await api.delete(`/customers/${id}`); toast.success('Mijoz o\'chirildi'); fetchCustomers(); }
    catch { toast.error('Xato'); }
  };

  const downloadPdf = async (id) => {
    try {
      const res = await api.get(`/customers/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = `mijoz_${id}.pdf`; a.click();
    } catch { toast.error('PDF yuklashda xato'); }
  };

  const shareWhatsApp = (c) => {
    const text = encodeURIComponent(`*Peak Fit* mijozi\nID: ${c.customerId}\nIsm: ${c.name} ${c.surname}\nTel: ${c.phone}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareTelegram = (c) => {
    const text = encodeURIComponent(`Peak Fit mijozi\nID: ${c.customerId}\nIsm: ${c.name} ${c.surname}`);
    window.open(`https://t.me/share/url?text=${text}`, '_blank');
  };

  return (
    <div>
      {/* Success overlay */}
      {successCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease] overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 my-8 animate-[fadeInScale_0.3s_ease]">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg mb-3">
                <CheckCircle2 size={32} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="text-xl font-bold text-slate-900">Mijoz qo'shildi!</div>
              <div className="text-slate-500 text-sm">QR-kod va ma'lumotlarni mijozga yuboring</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 flex items-start gap-3 mb-3">
              <div className="w-14 h-14 rounded-full bg-accent/15 flex items-center justify-center overflow-hidden flex-shrink-0">
                {successCustomer.photo
                  ? <img src={successCustomer.photo} alt="" className="w-full h-full object-cover" />
                  : <span className="text-accent-dark text-lg font-bold">{successCustomer.name?.[0]}{successCustomer.surname?.[0]}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 truncate">{successCustomer.name} {successCustomer.surname}</div>
                <div className="text-xs text-accent font-mono font-semibold">{successCustomer.customerId}</div>
                {successCustomer.phone && <div className="text-xs text-slate-500 mt-1">📱 {successCustomer.phone}</div>}
              </div>
            </div>
            {successCustomer.activeTariff?.isActive && successCustomer.activeTariff?.tariff && (
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-2.5 mb-3">
                <div className="text-[10px] uppercase tracking-wide text-accent-dark font-bold mb-0.5">Faol tarif</div>
                <div className="font-semibold text-slate-900 text-sm">{successCustomer.activeTariff.tariff.name}</div>
                <div className="text-xs text-slate-500">Tugash: {formatDate(successCustomer.activeTariff.endDate)}</div>
              </div>
            )}
            <div className="flex flex-col items-center bg-white border border-slate-200 rounded-2xl p-4 mb-3">
              <QRCodeSVG value={JSON.stringify({ id: successCustomer._id, customerId: successCustomer.customerId, name: successCustomer.name })} size={160} level="M" includeMargin />
              <div className="text-xs text-slate-500 mt-2 font-mono">{successCustomer.customerId}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button onClick={() => downloadPdf(successCustomer._id)} className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 py-2.5 rounded-xl text-xs font-semibold text-slate-700">
                <Download size={14} /> PDF
              </button>
              <button onClick={() => shareWhatsApp(successCustomer)} className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-semibold">WhatsApp</button>
              <button onClick={() => shareTelegram(successCustomer)} className="flex items-center justify-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white py-2.5 rounded-xl text-xs font-semibold">Telegram</button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { openDetail(successCustomer); setSuccessCustomer(null); }} className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-xl text-sm">Batafsil</button>
              <button onClick={() => setSuccessCustomer(null)} className="flex-1 bg-accent hover:bg-accent-dark text-white font-semibold py-2.5 rounded-xl text-sm">Yopish</button>
            </div>
          </div>
          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes fadeInScale{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}`}</style>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mijozlar</h1>
          <p className="text-gray-500 text-sm mt-0.5">Jami: {customers.length} ta mijoz</p>
        </div>
        <button onClick={openCreate} className="btn-accent flex items-center gap-2">
          <Plus size={18} /> Yangi Mijoz
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism, telefon yoki ID..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-accent" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Mijoz</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Telefon</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tarif</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Qarz</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {c.photo ? <img src={c.photo} alt="" className="w-full h-full object-cover" /> : <span className="text-accent-dark font-bold">{c.name[0]}{c.surname[0]}</span>}
                      </div>
                      <div>
                        <button onClick={() => openDetail(c)} className="font-medium text-gray-900 hover:text-accent transition-colors">
                          {c.name} {c.surname}
                        </button>
                        <div className="text-xs text-gray-400">{c.dob ? formatDate(c.dob) : '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-600">{c.customerId}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.phone || '-'}</td>
                  <td className="px-4 py-3">
                    {c.activeTariff?.isActive
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{c.activeTariff?.tariff?.name || 'Faol'}</span>
                      : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Yo'q</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {c.debt > 0
                      ? <span className="text-red-500 font-medium text-sm flex items-center gap-1"><AlertCircle size={14} />{formatMoney(c.debt)}</span>
                      : <span className="text-gray-400 text-sm">-</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => downloadPdf(c._id)} className="p-1.5 hover:bg-green-50 text-green-500 rounded-lg"><Download size={14} /></button>
                      <button onClick={() => shareWhatsApp(c)} className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg text-xs font-bold">WA</button>
                      <button onClick={() => shareTelegram(c)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg text-xs font-bold">TG</button>
                      <button onClick={() => handleDelete(c._id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Mijoz topilmadi</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Mijozni tahrirlash' : 'Yangi mijoz qo\'shish'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div onClick={() => fileRef.current?.click()} className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-accent overflow-hidden">
                {photoPreview ? <img src={photoPreview} alt="" className="w-full h-full object-cover" /> : <User size={32} className="text-gray-400" />}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              <span className="absolute -bottom-1 -right-1 bg-accent text-white text-xs px-2 py-0.5 rounded-full font-medium">Rasm</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ism *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-accent" placeholder="Ism" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Familya *</label>
              <input value={form.surname} onChange={e => setForm({...form, surname: e.target.value})} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-accent" placeholder="Familya" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-accent" placeholder="+998 90 123 45 67" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tug'ilgan sana</label>
              <input type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-accent" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarif belgilash</label>
              <select value={form.tariffId} onChange={e => setForm({...form, tariffId: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-accent">
                <option value="">— Tarif tanlanmagan —</option>
                {tariffs.map(t => <option key={t._id} value={t._id}>{t.name} — {t.price.toLocaleString()} UZS ({t.duration} kun)</option>)}
              </select>
              {form.tariffId && <p className="text-xs text-green-600 mt-1">✓ Saqlashda tarif avtomatik bog'lanadi</p>}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg hover:bg-gray-50 font-medium">Bekor qilish</button>
            <button type="submit" disabled={loading} className="flex-1 bg-accent text-white font-semibold py-2.5 rounded-lg hover:bg-accent-dark disabled:opacity-50">
              {loading ? 'Saqlanmoqda...' : (editing ? 'Saqlash' : 'Qo\'shish')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Full Detail modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="" size="lg">
        {selected && (
          <div>
            {/* Header */}
            <div className="flex items-start gap-4 mb-5 pb-5 border-b border-slate-100">
              <div className="w-20 h-20 rounded-2xl bg-accent/15 flex items-center justify-center overflow-hidden flex-shrink-0">
                {selected.photo
                  ? <img src={selected.photo} alt="" className="w-full h-full object-cover" />
                  : <span className="text-accent-dark text-2xl font-bold">{selected.name[0]}{selected.surname[0]}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-slate-900">{selected.name} {selected.surname}</h3>
                <div className="text-accent font-mono font-semibold text-sm mt-0.5">{selected.customerId}</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {selected.phone && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Phone size={13} className="text-slate-400" /> {selected.phone}
                    </div>
                  )}
                  {selected.dob && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Calendar size={13} className="text-slate-400" />
                      {formatDate(selected.dob)}
                      {calcAge(selected.dob) && <span className="text-slate-400">({calcAge(selected.dob)} yosh)</span>}
                    </div>
                  )}
                </div>
              </div>
              {/* QR code */}
              <div className="flex-shrink-0 text-center">
                <QRCodeSVG value={JSON.stringify({ id: selected._id, customerId: selected.customerId, name: selected.name })} size={80} level="M" />
                <div className="text-[9px] text-slate-400 font-mono mt-1">{selected.customerId}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                <div className="text-xs text-emerald-600 font-semibold mb-1 flex items-center gap-1"><TrendingUp size={12} /> Jami to'lagan</div>
                <div className="font-bold text-slate-900 text-sm tabular-nums">{formatMoney(selected.totalPaid || 0)}</div>
              </div>
              <div className={`${selected.debt > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'} border rounded-xl p-3`}>
                <div className={`text-xs font-semibold mb-1 flex items-center gap-1 ${selected.debt > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                  <AlertCircle size={12} /> Qarz
                </div>
                <div className={`font-bold text-sm tabular-nums ${selected.debt > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{formatMoney(selected.debt || 0)}</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1"><Tag size={12} /> Tarif</div>
                <div className="font-semibold text-slate-900 text-sm truncate">
                  {selected.activeTariff?.isActive ? (selected.activeTariff?.tariff?.name || 'Faol') : 'Yo\'q'}
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1"><Clock size={12} /> Tugash</div>
                <div className="font-semibold text-slate-900 text-sm">
                  {selected.activeTariff?.endDate ? formatDate(selected.activeTariff.endDate) : '—'}
                </div>
              </div>
            </div>

            {/* Purchase history */}
            <div>
              <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <ChevronRight size={16} className="text-accent" /> Xaridlar tarixi
                {!salesLoading && <span className="text-xs text-slate-400 font-normal">({selectedSales.length} ta)</span>}
              </h4>
              {salesLoading ? (
                <div className="text-center py-8 text-slate-400 text-sm">Yuklanmoqda...</div>
              ) : selectedSales.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-xl">Xaridlar yo'q</div>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Sana</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Tur</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">To'lov</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Summa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSales.map(s => (
                        <tr key={s._id} className="border-t border-slate-50 hover:bg-slate-50/50">
                          <td className="px-3 py-2 text-xs text-slate-500">
                            {new Date(s.createdAt).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                              ${s.saleType === 'tariff' ? 'bg-accent/15 text-accent-dark'
                                : s.saleType === 'debt_payment' ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'}`}>
                              {saleTypeLabel(s.saleType)}
                            </span>
                            {s.tariff?.name && <span className="text-xs text-slate-500 ml-1.5">{s.tariff.name}</span>}
                            {s.items?.[0]?.name && <span className="text-xs text-slate-500 ml-1.5">{s.items[0].name}</span>}
                          </td>
                          <td className="px-3 py-2">
                            <div className={`flex items-center gap-1 text-xs font-medium
                              ${s.paymentMethod === 'cash' ? 'text-emerald-600'
                                : s.paymentMethod === 'card' ? 'text-blue-600'
                                : 'text-rose-600'}`}>
                              {s.paymentMethod === 'cash' ? <Banknote size={12} /> : s.paymentMethod === 'card' ? <CreditCard size={12} /> : <AlertCircle size={12} />}
                              {payMethodLabel(s.paymentMethod)}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-900 tabular-nums text-sm">
                            {formatMoney(s.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
              <button onClick={() => downloadPdf(selected._id)} className="flex items-center justify-center gap-2 border border-slate-200 py-2 px-3 rounded-lg hover:bg-slate-50 text-sm text-slate-600">
                <Download size={14} /> PDF
              </button>
              <button onClick={() => shareWhatsApp(selected)} className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-2 px-3 rounded-lg hover:bg-emerald-600 text-sm">WA</button>
              <button onClick={() => shareTelegram(selected)} className="flex items-center justify-center gap-2 bg-sky-500 text-white py-2 px-3 rounded-lg hover:bg-sky-600 text-sm">TG</button>
              <div className="flex-1" />
              <button onClick={() => { openEdit(selected); setShowDetail(false); }} className="flex items-center justify-center gap-2 bg-slate-800 text-white py-2 px-4 rounded-lg hover:bg-slate-900 text-sm">
                <Edit2 size={14} /> Tahrirlash
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
