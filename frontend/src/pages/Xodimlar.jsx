import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, User, Eye, EyeOff,
  TrendingUp, Clock, ShoppingCart, Banknote, CreditCard, BarChart2,
  Key, Copy, CheckCircle2,
} from 'lucide-react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { formatMoney } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const ROLES_BY_CREATOR = {
  superadmin: [
    { value: 'admin',   label: 'Admin (club egasi)' },
    { value: 'manager', label: 'Menejer' },
    { value: 'cashier', label: 'Kassir' },
  ],
  admin: [
    { value: 'manager', label: 'Menejer' },
    { value: 'cashier', label: 'Kassir' },
  ],
};

const ROLE_LABELS = { superadmin: 'Super admin', admin: 'Admin', manager: 'Menejer', cashier: 'Kassir' };
const ROLE_COLORS = {
  superadmin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  manager: 'bg-amber-100 text-amber-700',
  cashier: 'bg-green-100 text-green-700',
};

const MODULES = [
  { key: 'kassa', label: 'Kassa' },
  { key: 'mijozlar', label: 'Mijozlar' },
  { key: 'ombor', label: 'Ombor' },
  { key: 'tariflar', label: 'Tariflar' },
  { key: 'xodimlar', label: 'Xodimlar' },
  { key: 'hisobotlar', label: 'Hisobotlar' },
  { key: 'sozlamalar', label: 'Sozlamalar' },
];

const INITIAL_FORM = (defaultRole = 'cashier') => ({
  name: '', surname: '', dob: '', phone: '', login: '', password: '', role: defaultRole,
  permissions: { kassa: true, mijozlar: true, ombor: false, xodimlar: false, tariflar: false, hisobotlar: false, sozlamalar: false },
});

function fmtMinutes(mins) {
  if (!mins) return '0 soat';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} daq`;
  if (m === 0) return `${h} soat`;
  return `${h}s ${m}d`;
}

export default function Xodimlar() {
  const { user: me } = useAuth();
  const canManage = me?.role === 'superadmin' || me?.role === 'admin';
  const availableRoles = ROLES_BY_CREATOR[me?.role] || [];

  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM(availableRoles[0]?.value || 'cashier'));
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const fileRef = useRef();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [empRes, statsRes] = await Promise.all([
        api.get('/employees'),
        api.get('/smena/stats').catch(() => ({ data: [] })),
      ]);
      setEmployees(empRes.data);
      const m = {};
      for (const s of statsRes.data) m[s.userId] = s;
      setStats(m);
    } catch { toast.error('Xato'); }
    finally { setStatsLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(INITIAL_FORM(availableRoles[0]?.value || 'cashier'));
    setPhoto(null); setPhotoPreview('');
    setShowModal(true);
  };

  const openEdit = (e) => {
    setEditing(e);
    setForm({
      name: e.name, surname: e.surname, dob: e.dob || '',
      phone: e.phone || '', login: e.login, password: '',
      role: e.role,
      permissions: { ...INITIAL_FORM().permissions, ...e.permissions },
    });
    setPhotoPreview(e.photo || '');
    setShowModal(true);
  };

  const handlePerm = (key) => setForm(f => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      const data = { ...form };
      if (!data.password && editing) delete data.password;
      // Let backend auto-generate login from phone if user didn't type one
      if (!data.login && data.phone) data.login = data.phone.replace(/\D/g, '');
      fd.append('data', JSON.stringify(data));
      if (photo) fd.append('photo', photo);
      if (editing) {
        await api.put(`/employees/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Xodim yangilandi');
        setShowModal(false);
      } else {
        const res = await api.post('/employees', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Xodim qo\'shildi');
        setShowModal(false);
        if (res.data?.credentials?.password) {
          setCredentials({
            login: res.data.credentials.login,
            password: res.data.credentials.password,
            who: `${res.data.name} ${res.data.surname}`,
          });
        }
      }
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Xato'); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async (emp) => {
    if (!confirm(`"${emp.name} ${emp.surname}" uchun yangi parol generatsiya qilinsinmi?`)) return;
    try {
      const res = await api.post(`/employees/${emp._id}/reset-password`);
      setCredentials({
        login: res.data.credentials.login,
        password: res.data.credentials.password,
        who: `${emp.name} ${emp.surname}`,
      });
      toast.success('Yangi parol yaratildi');
    } catch (err) { toast.error(err.response?.data?.message || 'Xato'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xodimni o\'chirishni tasdiqlaysizmi?')) return;
    try { await api.delete(`/employees/${id}`); toast.success('O\'chirildi'); fetchAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Xato'); }
  };

  const canEditTarget = (emp) => {
    if (me?.role === 'superadmin') return true;
    if (me?.role === 'admin') return emp.role === 'manager' || emp.role === 'cashier';
    return String(emp._id) === String(me?.id);
  };

  const totalStats = Object.values(stats);
  const grandTotal = totalStats.reduce((s, x) => s + x.totalSales, 0);
  const grandHours = totalStats.reduce((s, x) => s + x.totalMinutes, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Xodimlar</h1>
          <p className="text-gray-500 text-sm">{employees.length} ta xodim · siz: {ROLE_LABELS[me?.role]}</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="btn-accent flex items-center gap-2">
            <Plus size={18} /> Xodim qo'shish
          </button>
        )}
      </div>

      {!statsLoading && totalStats.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} className="text-emerald-500" />
            </span>
            <div>
              <div className="text-xs text-slate-500 font-medium">Jami tushum</div>
              <div className="font-bold text-slate-900">{formatMoney(grandTotal)}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Clock size={18} className="text-blue-500" />
            </span>
            <div>
              <div className="text-xs text-slate-500 font-medium">Jami ish soat</div>
              <div className="font-bold text-slate-900">{fmtMinutes(grandHours)}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <ShoppingCart size={18} className="text-orange-500" />
            </span>
            <div>
              <div className="text-xs text-slate-500 font-medium">Jami savdolar</div>
              <div className="font-bold text-slate-900">{totalStats.reduce((s, x) => s + x.saleCount, 0)} ta</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {employees.map(emp => {
          const s = stats[emp._id] || null;
          const canEdit = canEditTarget(emp);
          return (
            <div key={emp._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {emp.photo
                        ? <img src={emp.photo} alt="" className="w-full h-full object-cover" />
                        : <span className="text-accent-dark font-bold text-lg">{emp.name[0]}</span>}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{emp.name} {emp.surname}</div>
                      <div className="text-gray-400 text-xs font-mono">{emp.login}</div>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button onClick={() => handleResetPassword(emp)} title="Parolni yangilash" className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg">
                        <Key size={14} />
                      </button>
                      <button onClick={() => openEdit(emp)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg"><Edit2 size={14} /></button>
                      {String(emp._id) !== String(me?.id) && (
                        <button onClick={() => handleDelete(emp._id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[emp.role]}`}>
                    {ROLE_LABELS[emp.role]}
                  </span>
                  {emp.phone && <span className="text-gray-400 text-xs">{emp.phone}</span>}
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <BarChart2 size={13} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Statistika</span>
                  {s && <span className="text-[10px] text-slate-400 ml-auto">{s.smenaCount} smena</span>}
                </div>
                {!s ? (
                  <div className="text-xs text-slate-400 text-center py-1">Hali ma'lumot yo'q</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Stat icon={<TrendingUp size={10} />} color="text-emerald-600" label="Jami tushum" value={formatMoney(s.totalSales)} />
                    <Stat icon={<Clock size={10} />} color="text-blue-600" label="Ish vaqti" value={fmtMinutes(s.totalMinutes)} />
                    <Stat icon={<Banknote size={10} />} color="text-slate-500" label="Naqd" value={formatMoney(s.cashSales)} />
                    <Stat icon={<CreditCard size={10} />} color="text-slate-500" label="Karta" value={formatMoney(s.cardSales)} />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {employees.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <User size={48} className="mx-auto mb-3 opacity-30" />
            <p>Xodimlar yo'q</p>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Xodimni tahrirlash' : 'Yangi xodim qo\'shish'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <div onClick={() => fileRef.current?.click()} className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 cursor-pointer hover:border-accent flex items-center justify-center overflow-hidden">
              {photoPreview ? <img src={photoPreview} alt="" className="w-full h-full object-cover" /> : <User size={24} className="text-gray-400" />}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files[0]; if (f) { setPhoto(f); setPhotoPreview(URL.createObjectURL(f)); } }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ism *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Familiya *</label>
              <input value={form.surname} onChange={e => setForm({...form, surname: e.target.value})} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-accent" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon * <span className="text-xs text-gray-400">(login telefon raqami bo'ladi)</span>
              </label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value, login: e.target.value.replace(/\D/g, '') })} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-accent font-mono" placeholder="+998 90 123 45 67" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tug'ilgan sana</label>
              <input type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} disabled={editing && me?.role !== 'superadmin'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-accent disabled:bg-gray-50">
                {availableRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                {editing && !availableRoles.find(r => r.value === editing.role) && (
                  <option value={editing.role}>{ROLE_LABELS[editing.role]}</option>
                )}
              </select>
            </div>
            <div className="col-span-2 bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-xs text-emerald-800">
              {editing
                ? 'Parolni yangilash uchun ↻ tugmasidan foydalaning (kartochkada).'
                : 'Parol avtomatik 6 xonali raqam shaklida yaratiladi va saqlashdan keyin bir martagina ko\'rsatiladi.'}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg hover:bg-gray-50">Bekor qilish</button>
            <button type="submit" disabled={loading} className="flex-1 bg-accent text-white font-semibold py-2.5 rounded-lg hover:bg-accent-dark disabled:opacity-50">
              {loading ? 'Saqlanmoqda...' : (editing ? 'Saqlash' : 'Qo\'shish')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Credentials modal */}
      <Modal isOpen={!!credentials} onClose={() => setCredentials(null)} title="" size="sm">
        {credentials && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={24} className="text-emerald-600" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg">Login va parol tayyor</div>
                <div className="text-xs text-gray-500">{credentials.who}</div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
              ⚠️ <b>Diqqat:</b> Bu parol faqat shu yerda ko'rsatiladi. Saqlab oling — keyin ko'rinmaydi.
            </div>
            <div className="space-y-3">
              <CredField label="Login (telefon)" value={credentials.login} />
              <CredField label="Parol" value={credentials.password} big />
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { navigator.clipboard.writeText(`Login: ${credentials.login}\nParol: ${credentials.password}`); toast.success('Nusxa olindi'); }}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium text-sm"
              >
                <Copy size={14} /> Hammasini nusxa olish
              </button>
              <button onClick={() => setCredentials(null)} className="flex-1 bg-accent text-white font-semibold py-2.5 rounded-lg hover:bg-accent-dark text-sm">
                Yodlab oldim
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Stat({ icon, color, label, value }) {
  return (
    <div className="bg-white border border-slate-100 rounded-lg p-2">
      <div className={`flex items-center gap-1 text-[10px] font-semibold mb-0.5 ${color}`}>
        {icon} {label}
      </div>
      <div className="font-bold text-slate-900 text-sm tabular-nums">{value}</div>
    </div>
  );
}

function CredField({ label, value, big }) {
  const copy = () => { navigator.clipboard.writeText(value); toast.success('Nusxa olindi'); };
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="flex items-stretch gap-2">
        <div className={`flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 font-mono ${big ? 'text-2xl font-bold tracking-widest text-emerald-700' : 'text-base text-gray-900'}`}>
          {value}
        </div>
        <button onClick={copy} className="px-3 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900" title="Nusxa olish">
          <Copy size={15} />
        </button>
      </div>
    </div>
  );
}
