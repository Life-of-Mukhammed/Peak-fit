import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Eye, EyeOff, Lock, User as UserIcon } from 'lucide-react';
import api from '../utils/api';

export default function Login() {
  const [form, setForm] = useState({ login: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.login, form.password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xato yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {
      const res = await api.post('/auth/seed');
      toast.success(res.data.message);
    } catch {
      toast.error('Xato');
    }
  };

  return (
    <div className="min-h-screen bg-sidebar relative overflow-hidden flex items-center justify-center p-4">
      {/* Decorative background blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mb-4 shadow-xl shadow-accent/30">
            <Dumbbell size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Peak Fit</h1>
          <p className="text-slate-400 text-sm mt-1">Administrator Paneli</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white text-xl font-semibold mb-1">Tizimga kirish</h2>
          <p className="text-slate-400 text-sm mb-6">Login va parolingizni kiriting</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-xs mb-1.5 font-medium uppercase tracking-wide">Login</label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={form.login}
                  onChange={e => setForm({ ...form, login: e.target.value })}
                  placeholder="admin"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:border-accent focus:bg-white/10 focus:ring-2 focus:ring-accent/20 transition-all outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 text-xs mb-1.5 font-medium uppercase tracking-wide">Parol</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white placeholder-slate-500 focus:border-accent focus:bg-white/10 focus:ring-2 focus:ring-accent/20 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 mt-2 shadow-lg shadow-accent/20"
            >
              {loading ? 'Kirilmoqda...' : 'Kirish'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-white/5">
            <button onClick={handleSeed} className="w-full text-slate-500 hover:text-slate-300 text-xs transition-colors">
              Birinchi kirish? Admin yaratish (admin / admin123)
            </button>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          © {new Date().getFullYear()} Peak Fit. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </div>
  );
}
