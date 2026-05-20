import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import KgSidebar from './kg/Sidebar';
import KgTopbar from './kg/Topbar';
import TariffRequiredBanner from './TariffRequiredBanner';
import { useTariffs } from '../context/TariffsContext';
import { useAuth } from '../context/AuthContext';

const ROUTE_CRUMBS = {
  '/':          ['KiGo', 'Kassa'],
  '/dashboard': ['KiGo', 'Boshqaruv paneli'],
  '/mijozlar':  ['KiGo', 'Mijozlar'],
  '/ombor':     ['KiGo', 'Ombor'],
  '/tariflar':  ['KiGo', 'Tariflar'],
  '/xodimlar':  ['KiGo', 'Tizim', 'Xodimlar'],
  '/filiallar': ['KiGo', 'Mijoz clublar'],
  '/clublar':   ['KiGo', 'Mijoz clublar'],
  '/hisobotlar':['KiGo', 'Hisobotlar'],
  '/sozlamalar':['KiGo', 'Sozlamalar'],
  '/profil':    ['KiGo', 'Profil'],
  '/viloyatlar':['KiGo', 'Geografiya', 'Viloyatlar'],
  '/tumanlar':  ['KiGo', 'Geografiya', 'Tumanlar'],
  '/dillerlar': ['KiGo', 'Tarmoq', 'Dillerlar'],
  '/audit':     ['KiGo', 'Tizim', 'Audit log'],
};

function MainArea() {
  const location = useLocation();
  const { hasTariffs, loading } = useTariffs();
  const exempt = ['/tariflar', '/dashboard', '/viloyatlar', '/tumanlar', '/dillerlar', '/audit', '/sozlamalar', '/profil'];
  const isExempt = exempt.some(p => location.pathname.startsWith(p));
  if (loading) return <Outlet />;
  if (!hasTariffs && !isExempt) return <TariffRequiredBanner />;
  return <Outlet />;
}

function crumbsFor(pathname) {
  if (ROUTE_CRUMBS[pathname]) return ROUTE_CRUMBS[pathname];
  // detail pages: pick prefix
  for (const k of Object.keys(ROUTE_CRUMBS)) {
    if (pathname.startsWith(k + '/')) return ROUTE_CRUMBS[k];
  }
  return ['KiGo'];
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleScan = () => {
    if (location.pathname !== '/') navigate('/');
    setTimeout(() => window.dispatchEvent(new CustomEvent('peak:open-scanner')), 50);
  };
  const handleNewCustomer = () => {
    if (location.pathname !== '/mijozlar') navigate('/mijozlar?new=1');
    else window.dispatchEvent(new CustomEvent('peak:new-customer'));
  };

  return (
    <div className="kg-app">
      <KgSidebar onNewCustomer={handleNewCustomer} />
      <div className="kg-main">
        <KgTopbar crumbs={crumbsFor(location.pathname)} onScan={handleScan} />
        <main className="kg-page">
          <MainArea />
        </main>
        <Footer />
      </div>
    </div>
  );
}

function Footer() {
  const { user } = useAuth();
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--card)',
      padding: '8px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: 11,
      color: 'var(--muted)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
          Tizim holati: <b style={{ color: 'var(--text-mid)' }}>Online</b>
        </span>
        {user && <span>Rol: <b style={{ color: 'var(--text-mid)', textTransform: 'capitalize' }}>{user.role}</b></span>}
      </div>
      <div>© {new Date().getFullYear()} KiGo · Barcha huquqlar himoyalangan</div>
    </footer>
  );
}
