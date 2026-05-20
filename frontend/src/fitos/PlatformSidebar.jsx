import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import KiGoLogo from '../components/KiGoLogo';
import {
  Map, Layers, Tag, Building2, Wallet, MessageSquare,
  Settings, Users2, LogOut,
} from 'lucide-react';

const items = [
  { path: '/fitos',            icon: Map,           label: 'Viloyatlar',  end: true },
  { path: '/fitos/xizmatlar',  icon: Layers,        label: 'Xizmatlar' },
  { path: '/fitos/tariflar',   icon: Tag,           label: 'Tariflar' },
  { path: '/fitos/mijozlar',   icon: Building2,     label: 'Mijozlar' },
  { path: '/fitos/tolovlar',   icon: Wallet,        label: 'To‘lovlar' },
  { path: '/fitos/xabarlar',   icon: MessageSquare, label: 'Xabarlar' },
  { path: '/fitos/diller',     icon: Users2,        label: 'Diller' },
  { path: '/fitos/sozlamalar', icon: Settings,      label: 'Sozlamalar' },
];

export default function PlatformSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="w-[240px] min-w-[240px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col border-r border-white/5 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.08),transparent_60%)] pointer-events-none" />

      <div className="relative px-5 py-5 border-b border-white/5">
        <KiGoLogo size={40} subtitle="Super Admin" />
      </div>

      <nav className="relative flex-1 py-4 px-3 overflow-y-auto">
        {items.map(({ path, icon: Icon, label, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg text-sm transition-all
              ${isActive
                ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-white font-semibold border border-emerald-500/20 shadow-inner'
                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-emerald-400' : ''} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="relative px-3 pb-4">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/5 border border-white/5">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 text-xs font-bold">
            {user?.name?.[0]}{user?.surname?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user?.name} {user?.surname}</div>
            <div className="text-emerald-400/70 text-[10px]">Platform Admin</div>
          </div>
          <button onClick={handleLogout} title="Chiqish" className="text-slate-400 hover:text-rose-400 p-1 rounded transition-colors">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
