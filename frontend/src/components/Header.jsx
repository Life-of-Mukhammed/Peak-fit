import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Bell, HelpCircle, ChevronDown, Building2, Check, Plus,
  ScanLine, TrendingUp,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { useBranch } from '../context/BranchContext';
import { formatMoney } from '../utils/format';

export default function Header({ onScan }) {
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [todayProfit, setTodayProfit] = useState(0);
  const dropdownRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const { branches, selected, selectBranch } = useBranch();

  const isKassa = location.pathname === '/';

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Refresh today profit on Kassa or branch change
  useEffect(() => {
    if (!isKassa) return;
    const params = selected?._id ? `?branchId=${selected._id}` : '';
    api.get(`/reports/summary${params}`)
      .then(res => setTodayProfit(res.data.todayTotal || 0))
      .catch(() => {});
    // Listen for sale events to refresh
    const refresh = () => {
      api.get(`/reports/summary${params}`)
        .then(res => setTodayProfit(res.data.todayTotal || 0))
        .catch(() => {});
    };
    window.addEventListener('peak:sale-completed', refresh);
    return () => window.removeEventListener('peak:sale-completed', refresh);
  }, [isKassa, selected?._id]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/mijozlar?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const branchLabel = selected ? selected.name : 'Barcha filiallar';

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4">
      {/* Left: search OR today profit */}
      {isKassa ? (
        <div className="flex-1 max-w-md">
          <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-emerald-50/40 border border-emerald-100 rounded-xl px-4 py-2.5">
            <span className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} className="text-white" />
            </span>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-emerald-600 font-bold">Bugungi foyda</div>
              <div className="text-lg font-extrabold text-slate-900 tabular-nums leading-tight">{formatMoney(todayProfit)}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Qidiruv..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/15 outline-none transition-all"
            />
          </div>
        </div>
      )}

      {/* Right side */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Branch selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className={`hidden md:flex items-center gap-2 border rounded-xl px-3 py-2 text-sm font-medium transition-all min-w-[150px]
              ${dropdownOpen
                ? 'border-accent bg-accent/5 text-slate-900'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
          >
            <Building2 size={14} className={dropdownOpen ? 'text-accent' : 'text-slate-400'} />
            <span className="flex-1 text-left truncate">{branchLabel}</span>
            <ChevronDown size={13} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Filial tanlash</p>
              </div>
              <div className="py-1 max-h-64 overflow-y-auto">
                <button
                  onClick={() => { selectBranch(null); setDropdownOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left
                    ${!selected ? 'bg-accent/5' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Building2 size={15} className="text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">Barcha filiallar</div>
                    <div className="text-xs text-slate-400">Umumiy ko'rinish</div>
                  </div>
                  {!selected && <Check size={15} className="text-accent flex-shrink-0" />}
                </button>
                {branches.map(b => (
                  <button
                    key={b._id}
                    onClick={() => { selectBranch(b); setDropdownOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left
                      ${selected?._id === b._id ? 'bg-accent/5' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${b.isMain ? 'bg-accent/15' : 'bg-slate-100'}`}>
                      <Building2 size={15} className={b.isMain ? 'text-accent' : 'text-slate-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 flex items-center gap-1.5 truncate">
                        {b.name}
                        {b.isMain && <span className="text-[10px] text-accent font-semibold">ASOSIY</span>}
                      </div>
                      {b.address && <div className="text-xs text-slate-400 truncate">{b.address}</div>}
                    </div>
                    {selected?._id === b._id && <Check size={15} className="text-accent flex-shrink-0" />}
                  </button>
                ))}
                {branches.length === 0 && (
                  <div className="px-4 py-5 text-center text-slate-400 text-sm">Filiallar mavjud emas</div>
                )}
              </div>
              <div className="border-t border-slate-100 p-2">
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/filiallar'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-accent font-medium hover:bg-accent/10 transition-colors"
                >
                  <Plus size={14} />
                  Filiallarni boshqarish
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="relative p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent rounded-full" />
        </button>

        <button className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
          <HelpCircle size={18} />
        </button>

        <button
          onClick={onScan}
          className="ml-1 flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-accent/20"
        >
          <ScanLine size={15} />
          QR-skaner
        </button>
      </div>
    </header>
  );
}
