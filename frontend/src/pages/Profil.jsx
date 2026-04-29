import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Save, Eye, EyeOff, Camera, AlertTriangle, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import api from '../utils/api';

export default function Profil() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', surname: user?.surname || '', phone: user?.phone || '', dob: user?.dob || '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.photo || '');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetting, setResetting] = useState(false);
  const fileRef = useRef();

  const isSuperadmin = user?.role === 'superadmin';

  const handleReset = async () => {
    if (resetConfirm !== 'TOZALASH') return;
    setResetting(true);
    try {
      await api.post('/admin/reset');
      toast.success('Barcha ma\'lumotlar tozalandi. Qayta kirishingiz kerak.');
      // Wipe local state and force a fresh start
      localStorage.clear();
      setTimeout(() => { window.location.href = '/login'; }, 800);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xato');
      setResetting(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('data', JSON.stringify(form));
      if (photo) fd.append('photo', photo);
      await api.put(`/employees/${user.id || user._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Profil yangilandi');
    } catch (err) { toast.error(err.response?.data?.message || 'Xato'); }
    finally { setLoading(false); }
  };

  const handlePassChange = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) { toast.error('Parollar mos kelmadi'); return; }
    if (passForm.newPassword.length < 6) { toast.error('Parol kamida 6 ta belgi'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('data', JSON.stringify({ password: passForm.newPassword }));
      await api.put(`/employees/${user.id || user._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Parol o\'zgartirildi');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Xato'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Profil</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Shaxsiy ma'lumotlar</h2>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
                {photoPreview
                  ? <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                  : <span className="text-accent-dark text-2xl font-bold">{user?.name?.[0]}{user?.surname?.[0]}</span>
                }
              </div>
              <button type="button" onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 bg-accent rounded-full flex items-center justify-center hover:bg-accent-dark">
                <Camera size={14} className="text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files[0]; setPhoto(f); setPhotoPreview(URL.createObjectURL(f));
              }} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{user?.name} {user?.surname}</div>
              <div className="text-gray-500 text-sm capitalize">{user?.role}</div>
              <div className="text-gray-400 text-sm">{user?.login}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'name', label: 'Ism' },
              { key: 'surname', label: 'Familya' },
              { key: 'phone', label: 'Telefon' },
              { key: 'dob', label: 'Tug\'ilgan sana', type: 'date' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input type={f.type || 'text'} value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-accent" />
              </div>
            ))}
          </div>

          <button type="submit" disabled={loading} className="btn-accent flex items-center gap-2">
            <Save size={16} /> {loading ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Parolni o'zgartirish</h2>

        <form onSubmit={handlePassChange} className="space-y-3">
          {[
            { key: 'newPassword', label: 'Yangi parol' },
            { key: 'confirmPassword', label: 'Yangi parolni tasdiqlang' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={passForm[f.key]}
                  onChange={e => setPassForm({...passForm, [f.key]: e.target.value})} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:border-accent" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn-accent flex items-center gap-2">
            <Save size={16} /> Parolni o'zgartirish
          </button>
        </form>
      </div>

      {/* Danger zone — only for superadmin */}
      {isSuperadmin && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-rose-200 p-5">
          <div className="flex items-start gap-3 mb-4">
            <span className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-rose-600" />
            </span>
            <div>
              <h2 className="font-bold text-slate-900">Xavfli zona</h2>
              <p className="text-sm text-slate-500">
                Tizimni boshidan boshlash uchun barcha ma'lumotlarni tozalashingiz mumkin: mijozlar, sotuvlar, tariflar, hizmatlar, mahsulotlar, filiallar, hodimlar (sizdan tashqari), va tashriflar.
              </p>
            </div>
          </div>
          <button
            onClick={() => { setResetConfirm(''); setResetOpen(true); }}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-rose-500/20"
          >
            <Trash2 size={16} /> Hamma ma'lumotlarni tozalash
          </button>
        </div>
      )}

      <Modal isOpen={resetOpen} onClose={() => !resetting && setResetOpen(false)} title="Ma'lumotlarni tozalashni tasdiqlang" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
            <AlertTriangle size={22} className="text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-rose-900">
              <div className="font-bold mb-1">Bu amalni qaytarib bo'lmaydi!</div>
              <div>
                Barcha mijozlar, sotuvlar, tariflar, hizmatlar, mahsulotlar, filiallar, tashriflar va boshqa hodimlar o'chiriladi. Faqat sizning admin akkauntingiz qoladi.
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tasdiqlash uchun <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-bold">TOZALASH</code> deb yozing
            </label>
            <input
              value={resetConfirm}
              onChange={e => setResetConfirm(e.target.value)}
              autoFocus
              placeholder="TOZALASH"
              className="input"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setResetOpen(false)}
              disabled={resetting}
              className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-lg hover:bg-slate-50 font-medium"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleReset}
              disabled={resetting || resetConfirm !== 'TOZALASH'}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Trash2 size={15} /> {resetting ? 'Tozalanmoqda...' : 'Hammasini tozalash'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
