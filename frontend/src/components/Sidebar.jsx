import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSmena } from '../context/SmenaContext';
import { formatMoney } from '../utils/format';
import {
  ShoppingCart, Users, Package, Tag, UserCog,
  BarChart2, Settings, User, LogOut, Dumbbell,
  Building2, UserPlus, PlayCircle, StopCircle, X,
  Check, Banknote, CreditCard, AlertTriangle, Clock,
} from 'lucide-react';

const navItems = [
  { path: '/',           icon: ShoppingCart, label: 'Kassa',      key: 'kassa' },
  { path: '/mijozlar',   icon: Users,        label: 'Mijozlar',   key: 'mijozlar' },
  { path: '/ombor',      icon: Package,      label: 'Ombor',      key: 'ombor' },
  { path: '/tariflar',   icon: Tag,          label: 'Tariflar',   key: 'tariflar' },
  { path: '/xodimlar',   icon: UserCog,      label: 'Xodimlar',   key: 'xodimlar' },
  { path: '/filiallar',  icon: Building2,    label: 'Filiallar',  key: 'filiallar' },
  { path: '/hisobotlar', icon: BarChart2,    label: 'Hisobotlar', key: 'hisobotlar' },
  { path: '/sozlamalar', icon: Settings,     label: 'Sozlamalar', key: 'sozlamalar' },
  { path: '/profil',     icon: User,         label: 'Profil',     key: 'profil' },
];

function timeHM(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}
function dateFmt(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function Sidebar({ onNewCustomer }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentSmena, openSmena, closeSmena, closeReport, setCloseReport, canClose } = useSmena();
  const [smenaLoading, setSmenaLoading] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const canAccess = (key) => {
    if (key === 'profil' || key === 'filiallar') return true;
    if (user?.role === 'superadmin') return true;
    return user?.permissions?.[key];
  };

  const goNewCustomer = () => {
    if (typeof onNewCustomer === 'function') onNewCustomer();
    else navigate('/mijozlar?new=1');
  };

  const handleOpen = async () => {
    setSmenaLoading(true);
    try { await openSmena(); }
    catch { /* silent */ }
    finally { setSmenaLoading(false); }
  };

  const handleClose = async () => {
    setConfirmClose(false);
    setSmenaLoading(true);
    try { await closeSmena(); }
    catch { /* silent */ }
    finally { setSmenaLoading(false); }
  };

  return (
    <>
      <aside className="w-[230px] min-w-[230px] bg-sidebar flex flex-col border-r border-slate-800">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
              <Dumbbell size={20} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-[15px] leading-tight tracking-tight">Peak Fit</div>
              <div className="text-slate-400 text-[11px] leading-tight">Administrator Paneli</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {navItems.filter(item => canAccess(item.key)).map(({ path, icon: Icon, label }) => {
            const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
            return (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={`flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg text-sm transition-colors
                  ${isActive ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon size={18} className={isActive ? 'text-accent' : ''} />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Smena button */}
        <div className="px-3 pb-2 border-t border-white/5 pt-3">
          {currentSmena ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-500/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-emerald-300 text-[10px] font-semibold">SMENA OCHIQ</div>
                  <div className="text-slate-400 text-[9px] truncate">
                    {currentSmena.openedBy?.name} · {timeHM(currentSmena.openedAt)}
                  </div>
                </div>
              </div>
              {canClose ? (
                <button
                  onClick={() => setConfirmClose(true)}
                  disabled={smenaLoading}
                  className="w-full flex items-center justify-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <StopCircle size={14} /> Smena yopish
                </button>
              ) : (
                <div className="text-[10px] text-slate-500 text-center py-1 px-2 bg-slate-800/50 rounded-lg">
                  Smena yopilgunga qadar kuting
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleOpen}
              disabled={smenaLoading}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <PlayCircle size={14} /> Smena ochish
            </button>
          )}
        </div>

        {/* User pill */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.photo
                ? <img src={user.photo} alt="" className="w-8 h-8 object-cover" />
                : <span className="text-accent text-xs font-bold">{user?.name?.[0]}{user?.surname?.[0]}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{user?.name} {user?.surname}</div>
              <div className="text-slate-400 text-[10px] capitalize">{user?.role}</div>
            </div>
            <button onClick={handleLogout} title="Chiqish" className="text-slate-400 hover:text-red-400 p-1 rounded transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Yangi Mijoz CTA */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={goNewCustomer}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold py-2.5 rounded-xl transition-colors shadow-lg shadow-accent/20"
          >
            <UserPlus size={16} />
            Yangi Mijoz
          </button>
        </div>
      </aside>

      {/* Confirm close dialog */}
      {confirmClose && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={22} className="text-rose-500" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Smenani yopasizmi?</div>
                <div className="text-xs text-slate-500">Bugungi hisobot saqlanadi va adminga yuboriladi</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmClose(false)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl hover:bg-slate-50 font-medium text-sm">Bekor qilish</button>
              <button onClick={handleClose} disabled={smenaLoading} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50">
                {smenaLoading ? 'Yopilmoqda...' : 'Yopish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smena close report modal */}
      {closeReport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-6 pt-6 pb-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-bold">Smena hisoboti</div>
                <button onClick={() => setCloseReport(null)} className="p-1 hover:bg-white/10 rounded-lg"><X size={18} /></button>
              </div>
              <div className="text-sm text-slate-400">
                {dateFmt(closeReport.openedAt)} · {timeHM(closeReport.openedAt)} – {timeHM(closeReport.closedAt)}
              </div>
              <div className="text-3xl font-extrabold mt-3 tabular-nums">{formatMoney(closeReport.report?.totalSales || 0)}</div>
              <div className="text-xs text-slate-400 mt-0.5">Jami tushum</div>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Naqd', value: closeReport.report?.cashSales, icon: <Banknote size={14} />, color: 'text-emerald-600' },
                  { label: 'Karta', value: closeReport.report?.cardSales, icon: <CreditCard size={14} />, color: 'text-blue-600' },
                  { label: 'Qarz', value: closeReport.report?.debtSales, icon: <AlertTriangle size={14} />, color: 'text-rose-600' },
                  { label: 'Savdolar', value: null, count: closeReport.report?.saleCount, icon: <Check size={14} />, color: 'text-slate-600' },
                  { label: 'Tashriflar', value: null, count: closeReport.report?.attendanceCount, icon: <Clock size={14} />, color: 'text-orange-600' },
                  { label: 'Yangi mijoz', value: null, count: closeReport.report?.newCustomers, icon: <Users size={14} />, color: 'text-purple-600' },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3">
                    <div className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${item.color}`}>
                      {item.icon} {item.label}
                    </div>
                    <div className="font-bold text-slate-900 text-sm tabular-nums">
                      {item.value != null ? formatMoney(item.value) : (item.count ?? 0)}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setCloseReport(null)} className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
