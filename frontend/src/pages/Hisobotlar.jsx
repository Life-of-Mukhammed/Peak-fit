import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Calendar, Users, ShoppingCart, Tag,
  CreditCard, Banknote, UserCheck, Trophy, Crown, Award,
} from 'lucide-react';
import api from '../utils/api';
import { formatMoney, formatDateTime } from '../utils/format';
import { useBranch } from '../context/BranchContext';

const PAYMENT_COLORS = { cash: '#22c55e', card: '#3b82f6', debt: '#ef4444' };
const PAYMENT_LABELS = { cash: 'Naqd', card: 'Karta', debt: 'Qarz' };

function StatCard({ label, value, hint, icon: Icon, tone, delta }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-600',
    blue:  'bg-sky-50 text-sky-600',
    amber: 'bg-amber-50 text-amber-600',
    purple:'bg-violet-50 text-violet-600',
  };
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-slate-500">{label}</span>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${tones[tone]}`}>
          <Icon size={16} />
        </span>
      </div>
      <div className="text-xl font-bold text-slate-900">{value}</div>
      {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
      {typeof delta === 'number' && (
        <div className={`text-[11px] mt-1 flex items-center gap-1 font-medium
          ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
          {delta > 0 ? <TrendingUp size={12} /> : delta < 0 ? <TrendingDown size={12} /> : null}
          {delta > 0 ? '+' : ''}{delta.toFixed(1)}% (oldingi oyga nisbatan)
        </div>
      )}
    </div>
  );
}

export default function Hisobotlar() {
  const { selected } = useBranch();
  const branchParam = selected?._id ? `?branchId=${selected._id}` : '';

  const [tab, setTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [summary, setSummary] = useState({ todayTotal: 0, monthlyTotal: 0, activeSubscriptions: 0, totalDebt: 0, debtorCount: 0 });
  const [daily, setDaily] = useState({ total: 0, count: 0, sales: [] });
  const [weekly, setWeekly] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [byCashier, setByCashier] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { fetchAll(); }, [selectedDate, selected?._id]);

  const fetchAll = async () => {
    try {
      const dailyParam = `${branchParam ? branchParam + '&' : '?'}date=${selectedDate}`;
      const [a, s, d, w, m, c] = await Promise.all([
        api.get(`/reports/analytics${branchParam}`),
        api.get(`/reports/summary${branchParam}`),
        api.get(`/reports/daily${dailyParam}`),
        api.get(`/reports/weekly${branchParam}`),
        api.get(`/reports/monthly${branchParam}`),
        api.get(`/reports/by-cashier${branchParam}`),
      ]);
      setAnalytics(a.data);
      setSummary(s.data);
      setDaily(d.data); setWeekly(w.data); setMonthly(m.data); setByCashier(c.data);
    } catch { /* silent */ }
  };

  const tabs = [
    { key: 'overview', label: 'Umumiy' },
    { key: 'daily',    label: 'Kunlik' },
    { key: 'weekly',   label: 'Haftalik' },
    { key: 'monthly',  label: 'Oylik' },
    { key: 'cashier',  label: 'Kassirlar' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg">
        <div className="font-medium">{label}</div>
        <div className="text-accent">{formatMoney(payload[0].value)}</div>
      </div>
    );
  };

  const paymentChart = (analytics?.paymentBreakdown || []).filter(p => p.total > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hisobotlar va Analitika</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {selected ? `${selected.name} filiali bo'yicha` : 'Barcha filiallar bo\'yicha'}
          </p>
        </div>
        {tab === 'daily' && (
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-accent outline-none" />
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Bugungi tushum" value={formatMoney(summary.todayTotal)} hint="So'nggi 24 soat" icon={Calendar} tone="green" />
        <StatCard label="Oylik tushum" value={formatMoney(summary.monthlyTotal)} hint={`${analytics?.transactionCount || 0} ta tranzaksiya`} icon={TrendingUp} tone="blue" delta={analytics?.monthlyDeltaPct} />
        <StatCard label="Faol obunalar" value={`${summary.activeSubscriptions} ta`} hint={`+${analytics?.newCustomersThisMonth || 0} ta yangi mijoz`} icon={Users} tone="purple" />
        <StatCard label="Qarzdorlik" value={formatMoney(summary.totalDebt)} hint={`${summary.debtorCount} ta qarzdor`} icon={UserCheck} tone="amber" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === t.key ? 'bg-accent text-white shadow-md shadow-accent/20' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ---- OVERVIEW ---- */}
      {tab === 'overview' && analytics && (
        <div className="grid grid-cols-12 gap-4">
          {/* Payment breakdown pie */}
          <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={17} className="text-slate-400" />
              <h3 className="font-bold text-slate-800">To'lov turlari bo'yicha</h3>
            </div>
            {paymentChart.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">Bu oy hozircha sotuvlar yo'q</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={paymentChart}
                      dataKey="total"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {paymentChart.map((p, i) => (
                        <Cell key={i} fill={PAYMENT_COLORS[p.method] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => active && payload?.length ? (
                        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs">
                          <div>{PAYMENT_LABELS[payload[0].payload.method]}</div>
                          <div className="text-accent">{formatMoney(payload[0].value)}</div>
                        </div>
                      ) : null}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {paymentChart.map(p => {
                    const pct = analytics.monthlyTotal > 0 ? (p.total / analytics.monthlyTotal) * 100 : 0;
                    return (
                      <div key={p.method} className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full" style={{ background: PAYMENT_COLORS[p.method] }} />
                        <span className="flex-1 text-slate-600">{PAYMENT_LABELS[p.method]} <span className="text-slate-400">({p.count} ta)</span></span>
                        <span className="font-semibold text-slate-900 tabular-nums">{formatMoney(p.total)}</span>
                        <span className="text-xs text-slate-400 w-12 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Top tariffs */}
          <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={17} className="text-amber-500" />
              <h3 className="font-bold text-slate-800">Eng ko'p sotilgan tariflar</h3>
            </div>
            {(analytics.topTariffs || []).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">Ma'lumot yo'q</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.topTariffs} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#22c55e" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top products */}
          <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart size={17} className="text-sky-500" />
              <h3 className="font-bold text-slate-800">Eng ko'p sotilgan mahsulotlar</h3>
            </div>
            {(analytics.topProducts || []).length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">Mahsulot sotilmagan</div>
            ) : (
              <div className="space-y-2.5">
                {analytics.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm truncate">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.quantity} dona sotildi</div>
                    </div>
                    <div className="font-bold text-accent text-sm">{formatMoney(p.revenue)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top customers */}
          <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Crown size={17} className="text-violet-500" />
              <h3 className="font-bold text-slate-800">Eng faol mijozlar</h3>
            </div>
            {(analytics.topCustomers || []).length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">Mijoz sotuvi yo'q</div>
            ) : (
              <div className="space-y-2.5">
                {analytics.topCustomers.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg">
                    <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-accent-dark font-bold text-xs">{c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm truncate">{c.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{c.customerId} · {c.count} ta tranzaksiya</div>
                    </div>
                    <div className="font-bold text-accent text-sm">{formatMoney(c.total)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- DAILY ---- */}
      {tab === 'daily' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-slate-500 text-sm mb-1">Jami tushum</div>
              <div className="text-3xl font-bold text-accent">{formatMoney(daily.total)}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-slate-500 text-sm mb-1">Sotuvlar soni</div>
              <div className="text-3xl font-bold text-slate-900">{daily.count} ta</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 font-semibold text-slate-800">Bu kungi sotuvlar</div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Vaqt</th>
                    <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Mijoz</th>
                    <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Kassir</th>
                    <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">To'lov</th>
                    <th className="text-right px-4 py-2 text-xs text-slate-500 uppercase">Summa</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.sales.map(s => (
                    <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDateTime(s.createdAt)}</td>
                      <td className="px-4 py-3 text-sm">{s.customer ? `${s.customer.name} ${s.customer.surname}` : '-'}</td>
                      <td className="px-4 py-3 text-sm">{s.cashier?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${s.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-700' :
                            s.paymentMethod === 'card' ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700'}`}>
                          {PAYMENT_LABELS[s.paymentMethod]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-accent">{formatMoney(s.total)}</td>
                    </tr>
                  ))}
                  {daily.sales.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-slate-400">Bu kunda sotuvlar yo'q</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---- WEEKLY ---- */}
      {tab === 'weekly' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">So'nggi 7 kunlik savdo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-7 gap-2 mt-4">
            {weekly.map(d => (
              <div key={d.date} className="text-center bg-slate-50 rounded-lg p-2">
                <div className="text-xs text-slate-500">{d.date.slice(5)}</div>
                <div className="text-sm font-bold text-slate-800">{d.count} ta</div>
                <div className="text-xs text-accent font-semibold">{(d.total/1000).toFixed(0)}K</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- MONTHLY ---- */}
      {tab === 'monthly' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Oylik savdo dinamikasi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={v => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-slate-500">Oy</th>
                  <th className="text-right py-2 text-slate-500">Sotuvlar</th>
                  <th className="text-right py-2 text-slate-500">Tushum</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((m, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2">{m.month}</td>
                    <td className="py-2 text-right">{m.count}</td>
                    <td className="py-2 text-right font-semibold text-accent">{formatMoney(m.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- CASHIER ---- */}
      {tab === 'cashier' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 font-semibold text-slate-800 flex items-center gap-2">
            <Award size={17} className="text-amber-500" />
            Kassirlar bo'yicha sotuv
          </div>
          <div className="p-5">
            {byCashier.length === 0 ? (
              <div className="text-center py-12 text-slate-400">Ma'lumot yo'q</div>
            ) : (
              <div className="space-y-3">
                {byCashier.map((c, i) => {
                  const max = Math.max(...byCashier.map(x => x.total), 1);
                  const pct = (c.total / max) * 100;
                  return (
                    <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                        ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900">{c.name || 'Noma\'lum'}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-xs text-slate-500 w-20 text-right">{c.count} ta sotuv</div>
                        </div>
                      </div>
                      <div className="font-bold text-accent text-base whitespace-nowrap">{formatMoney(c.total)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
