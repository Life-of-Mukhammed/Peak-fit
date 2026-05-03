import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PlatformSidebar from './PlatformSidebar';

const TITLES = {
  '/fitos':            { title: 'Viloyatlar',  subtitle: 'Hududlar va tumanlar/shaharlarni boshqaring' },
  '/fitos/xizmatlar':  { title: 'Xizmatlar',   subtitle: 'Xizmat turlari (Fitness, Game club va boshqalar)' },
  '/fitos/tariflar':   { title: 'Tariflar',    subtitle: 'Tarif rejalari, narxlar va imkoniyatlar' },
  '/fitos/mijozlar':   { title: 'Mijozlar',    subtitle: 'Klublar, demolar va to‘lovchi mijozlar' },
  '/fitos/tolovlar':   { title: 'To‘lovlar',   subtitle: 'Davriy va bir martalik to‘lovlar' },
  '/fitos/xabarlar':   { title: 'Xabarlar',    subtitle: 'Mijozlardan kelgan xabarlar va javoblar' },
  '/fitos/diller':     { title: 'Diller',      subtitle: 'Hududiy dillerlar va ruxsatlar' },
  '/fitos/sozlamalar': { title: 'Sozlamalar',  subtitle: 'Tizim sozlamalari' },
};

export default function PlatformLayout() {
  const { pathname } = useLocation();
  const meta = TITLES[pathname] || { title: 'Kivo', subtitle: '' };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <PlatformSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{meta.title}</h1>
              {meta.subtitle && <p className="text-sm text-slate-500 mt-0.5">{meta.subtitle}</p>}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
