import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import TariffRequiredBanner from './TariffRequiredBanner';
import { useTariffs } from '../context/TariffsContext';

function MainArea() {
  const location = useLocation();
  const { hasTariffs, loading } = useTariffs();

  // Pages that should always render (so user can configure)
  const exempt = ['/tariflar'];
  const isExempt = exempt.some(p => location.pathname.startsWith(p));

  if (loading) return <Outlet />;
  if (!hasTariffs && !isExempt) return <TariffRequiredBanner />;
  return <Outlet />;
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const handleScan = () => {
    if (location.pathname !== '/') navigate('/');
    // Defer so Kassa is mounted before we dispatch
    setTimeout(() => window.dispatchEvent(new CustomEvent('peak:open-scanner')), 50);
  };

  const handleNewCustomer = () => {
    if (location.pathname !== '/mijozlar') navigate('/mijozlar?new=1');
    else window.dispatchEvent(new CustomEvent('peak:new-customer'));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar onNewCustomer={handleNewCustomer} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onScan={handleScan} />

        <main className="flex-1 overflow-auto p-6">
          <MainArea />
        </main>

        <footer className="border-t border-slate-200 bg-white px-6 py-2.5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
              Tizim holati: <span className="font-semibold text-slate-700">Online</span>
            </span>
            <a href="#" className="hover:text-slate-900 transition-colors">Yordam markazi</a>
          </div>
          <div>© {new Date().getFullYear()} Peak Fit. Barcha huquqlar himoyalangan.</div>
        </footer>
      </div>
    </div>
  );
}
