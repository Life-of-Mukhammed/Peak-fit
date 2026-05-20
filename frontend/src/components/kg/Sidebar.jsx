import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSmena } from '../../context/SmenaContext';
import { formatMoney } from '../../utils/format';
import Icon from './Icon';
import api from '../../utils/api';
import {
  PlayCircle, StopCircle, AlertTriangle, X, Check, Banknote, CreditCard, Users as LU, Clock,
} from 'lucide-react';

// ---------- Per-role navigation ----------
// `badge` (optional) is a key looked up in the live counts object.
const NAV_BY_ROLE = {
  // Super-admin — full KiGo network CRM
  superadmin: [
    { group: 'Asosiy', items: [
      { path: '/dashboard', icon: 'dashboard', label: 'Boshqaruv paneli' },
    ]},
    { group: 'Geografiya', items: [
      { path: '/viloyatlar', icon: 'map', label: 'Viloyatlar', badge: 'provinces' },
      { path: '/tumanlar',   icon: 'pin', label: 'Tumanlar',   badge: 'districts' },
    ]},
    { group: 'Tarmoq', items: [
      { path: '/clublar',   icon: 'building',  label: 'Mijoz clublar', badge: 'clubs' },
      { path: '/tariflar',  icon: 'layers',    label: 'Tariflar' },
      { path: '/dillerlar', icon: 'handshake', label: 'Dillerlar',     badge: 'dealers' },
    ]},
    { group: 'Hisobotlar', items: [
      { path: '/hisobotlar', icon: 'chart',  label: 'Hisobotlar' },
    ]},
    { group: 'Tizim', items: [
      { path: '/xodimlar',   icon: 'users',    label: 'Adminlar' },
      { path: '/audit',      icon: 'log',      label: 'Audit log' },
      { path: '/sozlamalar', icon: 'settings', label: 'Sozlamalar' },
      { path: '/profil',     icon: 'user',     label: 'Profil' },
    ]},
  ],

  // Admin — single-gym manager (KiGo club owner-side)
  admin: [
    { group: 'Asosiy', items: [
      { path: '/dashboard', icon: 'dashboard', label: 'Boshqaruv paneli' },
      { path: '/',          icon: 'cart',      label: 'Kassa' },
    ]},
    { group: 'Mijozlar', items: [
      { path: '/mijozlar', icon: 'users', label: 'Mijozlar', badge: 'customers' },
    ]},
    { group: 'Operatsiya', items: [
      { path: '/ombor',    icon: 'box',    label: 'Ombor' },
      { path: '/tariflar', icon: 'layers', label: 'Tariflar' },
    ]},
    { group: 'Hisobotlar', items: [
      { path: '/hisobotlar', icon: 'chart', label: 'Hisobotlar' },
    ]},
    { group: 'Tizim', items: [
      { path: '/xodimlar',   icon: 'users',    label: 'Xodimlar' },
      { path: '/filiallar',  icon: 'building', label: 'Filiallar', badge: 'clubs' },
      { path: '/sozlamalar', icon: 'settings', label: 'Sozlamalar' },
      { path: '/profil',     icon: 'user',     label: 'Profil' },
    ]},
  ],

  // Manager — operational shift lead
  manager: [
    { group: 'Asosiy', items: [
      { path: '/dashboard', icon: 'dashboard', label: 'Boshqaruv paneli' },
      { path: '/',          icon: 'cart',      label: 'Kassa' },
    ]},
    { group: 'Mijozlar', items: [
      { path: '/mijozlar', icon: 'users', label: 'Mijozlar' },
    ]},
    { group: 'Operatsiya', items: [
      { path: '/ombor', icon: 'box', label: 'Ombor' },
    ]},
    { group: 'Hisobotlar', items: [
      { path: '/hisobotlar', icon: 'chart', label: 'Hisobotlar' },
    ]},
    { group: 'Hisob', items: [
      { path: '/profil', icon: 'user', label: 'Profil' },
    ]},
  ],

  // Cashier — POS only
  cashier: [
    { group: 'Ish joyim', items: [
      { path: '/',         icon: 'cart',  label: 'Kassa' },
      { path: '/mijozlar', icon: 'users', label: 'Mijozlar' },
    ]},
    { group: 'Hisob', items: [
      { path: '/profil', icon: 'user', label: 'Profil' },
    ]},
  ],
};

const ROLE_LABEL = {
  superadmin: 'Super admin',
  admin:      'Administrator',
  manager:    'Menejer',
  cashier:    'Kassir',
};

const ROLE_SUB = {
  superadmin: 'Tarmoq · CRM',
  admin:      'Mijoz club admini',
  manager:    'Operatsion menejer',
  cashier:    'Kassa xodimi',
};

const timeHM  = (d) => d ? new Date(d).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '';
const dateFmt = (d) => d ? new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

export default function KgSidebar({ onNewCustomer }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentSmena, openSmena, closeSmena, closeReport, setCloseReport, canClose } = useSmena();
  const [smenaLoading, setSmenaLoading] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [counts, setCounts] = useState({});

  const role = user?.role || 'cashier';
  const nav = NAV_BY_ROLE[role] || NAV_BY_ROLE.cashier;

  // Pull live counts for sidebar badges; refresh when route changes (creates/deletes propagate)
  useEffect(() => {
    if (!user) return;
    api.get('/dashboard/counts').then(r => setCounts(r.data || {})).catch(() => {});
  }, [user?.id, location.pathname]);
  // Roles that get the Kassa shift controls + "Yangi Mijoz" CTA
  const showSmena      = ['admin', 'manager', 'cashier'].includes(role);
  const showNewCustomer = ['admin', 'manager', 'cashier'].includes(role);

  const handleOpen = async () => {
    setSmenaLoading(true);
    try { await openSmena(); } catch {} finally { setSmenaLoading(false); }
  };

  const handleClose = async () => {
    setConfirmClose(false);
    setSmenaLoading(true);
    try { await closeSmena(); } catch {} finally { setSmenaLoading(false); }
  };

  return (
    <>
      <aside className="kg-side">
        <div className="kg-logo" onClick={() => navigate(role === 'cashier' ? '/' : '/dashboard')}>
          <div className="kg-logo-mark">K</div>
          <div>
            <div className="kg-logo-name">KiGo</div>
            <div className="kg-logo-sub">{ROLE_LABEL[role]}</div>
          </div>
        </div>

        {nav.map((g, gi) => (
          <React.Fragment key={gi}>
            <div className="kg-nav-group">{g.group}</div>
            {g.items.map(it => {
              const isActive = it.path === '/'
                ? location.pathname === '/'
                : location.pathname === it.path || location.pathname.startsWith(it.path + '/');
              const badgeVal = it.badge ? counts[it.badge] : null;
              return (
                <NavLink key={it.path} to={it.path} end={it.path === '/'} className={`kg-nav-item ${isActive ? 'active' : ''}`}>
                  <Icon name={it.icon} size={16} />
                  <span>{it.label}</span>
                  {badgeVal != null && badgeVal > 0 && <span className="badge-r">{badgeVal}</span>}
                </NavLink>
              );
            })}
          </React.Fragment>
        ))}

        {/* Smena — only for ops roles */}
        {showSmena && (
          <div style={{ paddingTop: 12, marginTop: 12, borderTop: '1px solid var(--border)' }}>
            {currentSmena ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, background: 'var(--accent-soft-2)' }}>
                  <span className="dot-stat ok" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ color: 'var(--accent-hover)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>SMENA OCHIQ</div>
                    <div style={{ color: 'var(--muted)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {currentSmena.openedBy?.name} · {timeHM(currentSmena.openedAt)}
                    </div>
                  </div>
                </div>
                {canClose ? (
                  <button onClick={() => setConfirmClose(true)} disabled={smenaLoading} className="btn btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger-soft)', background: 'var(--danger-soft)', justifyContent: 'center' }}>
                    <StopCircle size={13} /> Smena yopish
                  </button>
                ) : (
                  <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', padding: '4px 6px', background: 'var(--bg-soft)', borderRadius: 6 }}>
                    Smena yopilgunga qadar kuting
                  </div>
                )}
              </div>
            ) : (
              <button onClick={handleOpen} disabled={smenaLoading} className="btn btn-sm" style={{ width: '100%', color: 'var(--accent-hover)', background: 'var(--accent-soft-2)', borderColor: 'var(--accent-soft)', justifyContent: 'center' }}>
                <PlayCircle size={13} /> Smena ochish
              </button>
            )}
          </div>
        )}

        {/* Yangi mijoz CTA — only for ops roles */}
        {showNewCustomer && (
          <div style={{ paddingTop: 8 }}>
            <button onClick={onNewCustomer} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', height: 34 }}>
              <Icon name="plus" size={14} /> Yangi Mijoz
            </button>
          </div>
        )}

        {/* "Yangi club" for super-admin */}
        {role === 'superadmin' && (
          <div style={{ paddingTop: 12 }}>
            <button onClick={() => navigate('/clublar')} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', height: 34 }}>
              <Icon name="plus" size={14} /> Yangi club
            </button>
          </div>
        )}

        <div className="kg-side-foot">
          <div className="kg-avatar">{user?.name?.[0]}{user?.surname?.[0]}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="nm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name} {user?.surname}</div>
            <div className="rl">{ROLE_SUB[role]}</div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} title="Chiqish" style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}>
            <Icon name="logout" size={16} />
          </button>
        </div>
      </aside>

      {confirmClose && (
        <div className="kg-overlay" onClick={() => setConfirmClose(false)}>
          <div className="kg-modal" style={{ width: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="kg-modal-head" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--danger-soft)', display: 'grid', placeItems: 'center', color: 'var(--danger)', flexShrink: 0 }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3>Smenani yopasizmi?</h3>
                <p>Bugungi hisobot saqlanadi va adminga yuboriladi</p>
              </div>
            </div>
            <div className="kg-modal-foot">
              <button onClick={() => setConfirmClose(false)} className="btn btn-ghost">Bekor qilish</button>
              <button onClick={handleClose} disabled={smenaLoading} className="btn" style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' }}>
                {smenaLoading ? 'Yopilmoqda...' : 'Yopish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {closeReport && (
        <div className="kg-overlay" onClick={() => setCloseReport(null)}>
          <div className="kg-modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(160deg, #052e16, #14532d)', padding: '20px 22px', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Smena hisoboti</div>
                <button onClick={() => setCloseReport(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {dateFmt(closeReport.openedAt)} · {timeHM(closeReport.openedAt)} – {timeHM(closeReport.closedAt)}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(closeReport.report?.totalSales || 0)}
              </div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Jami tushum</div>
            </div>
            <div className="kg-modal-body" style={{ padding: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Naqd',       value: closeReport.report?.cashSales,      icon: <Banknote size={14} />, color: 'var(--accent-hover)' },
                  { label: 'Karta',      value: closeReport.report?.cardSales,      icon: <CreditCard size={14} />, color: 'var(--info)' },
                  { label: 'Qarz',       value: closeReport.report?.debtSales,      icon: <AlertTriangle size={14} />, color: 'var(--danger)' },
                  { label: 'Savdolar',   value: null, count: closeReport.report?.saleCount,        icon: <Check size={14} />, color: 'var(--text-mid)' },
                  { label: 'Tashriflar', value: null, count: closeReport.report?.attendanceCount,  icon: <Clock size={14} />, color: 'var(--warn)' },
                  { label: 'Yangi mijoz',value: null, count: closeReport.report?.newCustomers,     icon: <LU size={14} />, color: 'var(--accent-hover)' },
                ].map((it, i) => (
                  <div key={i} style={{ background: 'var(--bg-soft)', borderRadius: 10, padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, marginBottom: 4, color: it.color }}>
                      {it.icon} {it.label}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                      {it.value != null ? formatMoney(it.value) : (it.count ?? 0)}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setCloseReport(null)} className="btn btn-primary" style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}>
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
