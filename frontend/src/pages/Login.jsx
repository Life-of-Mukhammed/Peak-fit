import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Icon from '../components/kg/Icon';

export default function Login() {
  const [form, setForm] = useState({ login: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const HOME = { superadmin: '/dashboard', admin: '/dashboard', manager: '/dashboard', cashier: '/' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form.login, form.password);
      navigate(HOME[res?.user?.role] || '/');
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
    <div className="kg-login">
      <div className="kg-login-side">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>P</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>KiGo</div>
            <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Super admin</div>
          </div>
        </div>
        <div style={{ marginTop: 'auto', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
            CRM tizimi
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 14px', maxWidth: 460, lineHeight: 1.15 }}>
            Sport va xizmat clublarini bir oynadan boshqaring
          </h2>
          <p style={{ fontSize: 14, opacity: 0.75, maxWidth: 420, lineHeight: 1.6, margin: 0 }}>
            Fitness, PS, tennis, bilyard va boshqa maishiy xizmat ko'rsatuvchilar uchun
            yagona platforma. Viloyatlar, tariflar va dillerlar — barchasi nazoratingizda.
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 36, fontSize: 12, opacity: 0.7 }}>
            <div><div style={{ fontSize: 22, fontWeight: 700, color: '#86efac' }}>14</div><div>Viloyat</div></div>
            <div><div style={{ fontSize: 22, fontWeight: 700, color: '#86efac' }}>∞</div><div>Faol club</div></div>
            <div><div style={{ fontSize: 22, fontWeight: 700, color: '#86efac' }}>24/7</div><div>Qo'llab-quvvatlash</div></div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 24, left: 48, fontSize: 11, opacity: 0.5, zIndex: 1 }}>
          © {new Date().getFullYear()} KiGo · v2.0
        </div>
      </div>

      <div className="kg-login-form-wrap">
        <div className="kg-login-form">
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
              Tizimga kirish
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
              Davom etish uchun hisob ma'lumotlaringizni kiriting
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label>Login yoki telefon raqam</label>
              <div className="input-wrap">
                <Icon name="user" size={14} className="pfx" />
                <input
                  className="kg-input with-prefix"
                  value={form.login}
                  onChange={(e) => setForm({ ...form, login: e.target.value })}
                  placeholder="admin"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label>Parol</label>
                <a style={{ fontSize: 11.5, color: 'var(--accent-hover)', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>
                  Parolni unutdingizmi?
                </a>
              </div>
              <div className="input-wrap">
                <Icon name="lock" size={14} className="pfx" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="kg-input with-prefix"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                >
                  <Icon name="eye" size={14} />
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 42, marginTop: 8 }}>
              {loading ? 'Kirilmoqda...' : (<>Kirish <Icon name="arrowRight" size={14} /></>)}
            </button>
          </form>

          <div style={{ marginTop: 32, padding: '12px 14px', borderRadius: 10, background: 'var(--accent-soft-2)', border: '1px solid var(--accent-soft)', fontSize: 12, color: 'var(--text-mid)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Icon name="shield" size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
            <div>
              Hisobingiz xavfsiz himoyalangan. Login bo'lishdan oldin admin akkauntini yarating.
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button onClick={handleSeed} type="button" className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
              <Icon name="refresh" size={13} /> Demo akkauntlarni yaratish
            </button>
          </div>

          <details style={{ marginTop: 14, fontSize: 12, color: 'var(--muted)' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-mid)' }}>
              Demo loginlar (test uchun)
            </summary>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
              {[
                { l: 'superadmin', p: 'super123',   r: 'Super admin' },
                { l: 'admin',      p: 'admin123',   r: 'Administrator' },
                { l: 'manager',    p: 'manager123', r: 'Menejer' },
                { l: 'kassir',     p: 'kassir123',  r: 'Kassir' },
              ].map(a => (
                <button
                  key={a.l}
                  type="button"
                  onClick={() => setForm({ login: a.l, password: a.p })}
                  style={{
                    background: 'var(--bg-soft)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    textAlign: 'left',
                  }}
                >
                  <span><b style={{ color: 'var(--text)' }}>{a.l}</b> / {a.p}</span>
                  <span style={{ color: 'var(--accent-hover)', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>{a.r}</span>
                </button>
              ))}
            </div>
          </details>

          <div style={{ marginTop: 18, fontSize: 11, color: 'var(--muted-2)', textAlign: 'center' }}>
            Yordam: <a style={{ color: 'var(--accent-hover)', textDecoration: 'none', fontWeight: 600 }}>support@kigo.uz</a>
          </div>
        </div>
      </div>
    </div>
  );
}
