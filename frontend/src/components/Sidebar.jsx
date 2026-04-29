import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart, Users, Package, Tag, UserCog,
  BarChart2, Settings, User, LogOut, Dumbbell,
  Building2, UserPlus, ChevronDown,
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

export default function Sidebar({ onNewCustomer }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const canAccess = (key) => {
    if (key === 'profil' || key === 'filiallar') return true;
    if (user?.role === 'superadmin') return true;
    return user?.permissions?.[key];
  };

  const goNewCustomer = () => {
    if (typeof onNewCustomer === 'function') onNewCustomer();
    else navigate('/mijozlar?new=1');
  };

  return (
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
                ${isActive
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Icon size={18} className={isActive ? 'text-accent' : ''} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

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
          <button
            onClick={handleLogout}
            title="Chiqish"
            className="text-slate-400 hover:text-red-400 p-1 rounded transition-colors"
          >
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
  );
}
