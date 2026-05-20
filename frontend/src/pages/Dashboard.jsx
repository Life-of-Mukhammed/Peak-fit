import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import Page from '../components/kg/Page';
import Btn from '../components/kg/Btn';
import Icon from '../components/kg/Icon';
import Badge from '../components/kg/Badge';
import { Donut, BarChart } from '../components/kg/Charts';
import { formatMoney } from '../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  if (role === 'superadmin') return <SuperAdminBoard />;
  if (role === 'admin')      return <AdminBoard />;
  if (role === 'manager')    return <ManagerBoard />;
  return <ManagerBoard />; // fallback for cashier if they ever land here
}

/* ============================================================
   Super-admin · Network CRM dashboard
   ============================================================ */
function SuperAdminBoard() {
  const [data, setData] = useState(null);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [d, a] = await Promise.all([
          api.get('/dashboard'),
          api.get('/audit?limit=6'),
        ]);
        setData(d.data);
        setAudit(a.data || []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const monthLabel = new Date().toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' });

  return (
    <Page
      title="Tarmoq boshqaruv paneli"
      subtitle={`Super admin · ${monthLabel}${loading ? ' · yuklanmoqda...' : ''}`}
      actions={
        <>
          <Btn icon="calendar" size="sm">Bu oy</Btn>
          <Btn icon="download" size="sm">Eksport</Btn>
          <Btn variant="primary" icon="plus" size="sm" to="/clublar">Yangi club</Btn>
        </>
      }
    >
      <div className="kpi-grid">
        <Kpi icon="building" label="Faol clublar" value={data?.clubsCount ?? '—'} />
        <Kpi
          icon="wallet"
          label="Oylik tushum"
          value={fmtCompact(data?.monthRevenue ?? 0)}
          suffix="so'm"
          delta={data?.revenueDelta != null ? `${data.revenueDelta >= 0 ? '+' : ''}${data.revenueDelta.toFixed(1)}%` : null}
          deltaDown={data?.revenueDelta < 0}
        />
        <Kpi icon="handshake" label="Faol dillerlar" value={data?.activeDealers ?? 0} sub={`${data?.dealersCount ?? 0} ta jami`} />
        <Kpi icon="alert" label="Qarzdor mijozlar" value={data?.overdueCount ?? 0} valueColor={(data?.overdueCount ?? 0) > 0 ? 'var(--danger)' : undefined} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="kg-card">
          <div className="kg-card-head">
            <div>
              <h3>Tushum dinamikasi</h3>
              <div className="sub">So'mda · oxirgi 12 oy</div>
            </div>
          </div>
          <div className="kg-card-body">
            {data?.trend?.length
              ? <BarChart data={data.trend.map(t => t.total)} labels={data.trend.map(t => t.month)} />
              : <Empty msg="Tushum ma'lumotlari yo'q" />}
          </div>
        </div>

        <div className="kg-card">
          <div className="kg-card-head"><h3>Club turi bo'yicha</h3></div>
          <div className="kg-card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            {(() => {
              const colors = { ps: '#16A34A', billiard: '#65A30D', fitness: '#84CC16', tennis: '#A3E635', other: '#D9F99D' };
              const labels = { ps: 'PlayStation', billiard: 'Bilyard', fitness: 'Fitness', tennis: 'Tennis', other: 'Boshqa' };
              const items = (data?.clubsByKind || []).filter(x => x.count > 0);
              const total = items.reduce((s, x) => s + x.count, 0) || 1;
              if (items.length === 0) return <Empty msg="Hozircha clublar yo'q" cta={{ label: "Club qo'shish", to: '/clublar' }} />;
              return (
                <>
                  <Donut segments={items.map(it => ({ v: it.count, c: colors[it.kind] || '#D9F99D' }))} />
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {items.map((it, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 999, background: colors[it.kind] || '#D9F99D' }} />
                        <span style={{ flex: 1, color: 'var(--text-mid)' }}>{labels[it.kind] || it.kind}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{it.count}</span>
                        <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', width: 42, textAlign: 'right' }}>
                          {((it.count / total) * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="kg-card">
          <div className="kg-card-head">
            <h3>Eng faol viloyatlar</h3>
            <a href="/viloyatlar" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--accent-hover)', fontWeight: 600, textDecoration: 'none' }}>
              Hammasini ko'rish →
            </a>
          </div>
          <div className="kg-card-body" style={{ padding: 0 }}>
            {data?.topProvinces?.length ? (
              <table className="kg-table">
                <thead><tr><th>Viloyat</th><th>Clublar</th><th style={{ width: 180 }}>Ulush</th></tr></thead>
                <tbody>
                  {(() => {
                    const max = Math.max(...data.topProvinces.map(p => p.clubsCount), 1);
                    return data.topProvinces.map((p, i) => (
                      <tr key={i}>
                        <td className="cell-strong">{p.name}</td>
                        <td className="num">{p.clubsCount}</td>
                        <td><div className="prg"><div className="fill" style={{ width: (p.clubsCount / max * 100) + '%' }} /></div></td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            ) : <Empty msg="Hozircha viloyatlar yo'q" cta={{ label: "Viloyat qo'shish", to: '/viloyatlar' }} />}
          </div>
        </div>

        <div className="kg-card">
          <div className="kg-card-head">
            <h3>Oxirgi harakatlar</h3>
            <a href="/audit" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--accent-hover)', fontWeight: 600, textDecoration: 'none' }}>
              Audit log →
            </a>
          </div>
          <div className="kg-card-body">
            {audit.length ? (
              <div className="tl">
                {audit.map((a, i) => (
                  <div key={i} className={`tl-item ${a.action === 'delete' || a.action === 'auth_fail' ? 'muted' : ''}`}>
                    <div className="tl-time">{new Date(a.createdAt).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="tl-title"><b>{a.userName}</b> {a.description}</div>
                  </div>
                ))}
              </div>
            ) : <Empty msg="Hozircha harakatlar yo'q" />}
          </div>
        </div>
      </div>
    </Page>
  );
}

/* ============================================================
   Admin · Single-gym admin board (full ops + finance)
   ============================================================ */
function AdminBoard() {
  const { selected } = useBranch();
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const q = selected?._id ? `?branchId=${selected._id}` : '';
      try {
        const [s, a] = await Promise.all([
          api.get('/reports/summary' + q),
          api.get('/reports/analytics' + q),
        ]);
        setData(s.data);
        setAnalytics(a.data);
      } catch {} finally { setLoading(false); }
    })();
  }, [selected?._id]);

  const today = new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Page
      title="Admin paneli"
      subtitle={`Bugun · ${today}${selected ? ` · ${selected.name}` : ' · Barcha filiallar'}${loading ? ' · yuklanmoqda...' : ''}`}
      actions={
        <>
          <Btn icon="download" size="sm" to="/hisobotlar">To'liq hisobot</Btn>
          <Btn variant="primary" icon="plus" size="sm" to="/mijozlar?new=1">Yangi mijoz</Btn>
        </>
      }
    >
      <div className="kpi-grid">
        <Kpi icon="wallet" label="Bugungi tushum" value={formatMoney(data?.todayTotal || 0)} />
        <Kpi icon="chart"  label="Oylik tushum"   value={formatMoney(data?.monthTotal || 0)} />
        <Kpi icon="users"  label="Faol obunalar"  value={data?.activeSubscriptions ?? 0} sub={`${data?.totalCustomers ?? 0} ta jami`} />
        <Kpi icon="alert"  label="Jami qarz"      value={formatMoney(data?.totalDebt || 0)} valueColor={(data?.totalDebt ?? 0) > 0 ? 'var(--danger)' : undefined} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="kg-card">
          <div className="kg-card-head"><h3>To'lov usullari (bu oy)</h3></div>
          <div className="kg-card-body">
            {analytics?.paymentBreakdown ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Naqd',  v: analytics.paymentBreakdown.cash, c: 'var(--accent)' },
                  { label: 'Karta', v: analytics.paymentBreakdown.card, c: 'var(--info)' },
                  { label: 'Qarz',  v: analytics.paymentBreakdown.debt, c: 'var(--danger)' },
                ].map((r, i) => {
                  const total = (analytics.paymentBreakdown.cash || 0) + (analytics.paymentBreakdown.card || 0) + (analytics.paymentBreakdown.debt || 0);
                  const pct = total ? (r.v / total) * 100 : 0;
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-mid)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 999, background: r.c }} />
                          {r.label}
                        </span>
                        <span className="num cell-strong">{formatMoney(r.v || 0)} <span className="muted">· {pct.toFixed(1)}%</span></span>
                      </div>
                      <div className="prg"><div className="fill" style={{ width: pct + '%', background: r.c }} /></div>
                    </div>
                  );
                })}
              </div>
            ) : <Empty msg="To'lov ma'lumotlari yo'q" />}
          </div>
        </div>

        <div className="kg-card">
          <div className="kg-card-head"><h3>Eng yaxshi mahsulotlar</h3></div>
          <div className="kg-card-body" style={{ padding: 0 }}>
            {analytics?.topProducts?.length ? (
              <table className="kg-table">
                <tbody>
                  {analytics.topProducts.slice(0, 5).map((p, i) => (
                    <tr key={i}>
                      <td className="cell-strong">{p.name}</td>
                      <td className="num right">{formatMoney(p.revenue || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <Empty msg="Hali savdo yo'q" />}
          </div>
        </div>
      </div>

      <div className="kg-card">
        <div className="kg-card-head"><h3>Eng yaxshi mijozlar</h3></div>
        <div className="kg-card-body" style={{ padding: 0 }}>
          {analytics?.topCustomers?.length ? (
            <table className="kg-table">
              <thead><tr><th>Mijoz</th><th>Telefon</th><th className="num right">Jami to'lagan</th></tr></thead>
              <tbody>
                {analytics.topCustomers.slice(0, 8).map((c, i) => (
                  <tr key={i}>
                    <td className="cell-strong">{c.name}</td>
                    <td className="muted">{c.phone || '—'}</td>
                    <td className="num right">{formatMoney(c.totalPaid || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty msg="Mijozlar yo'q" cta={{ label: 'Mijozlar', to: '/mijozlar' }} />}
        </div>
      </div>
    </Page>
  );
}

/* ============================================================
   Manager · Operational board (today-only KPIs + active shift)
   ============================================================ */
function ManagerBoard() {
  const { selected } = useBranch();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const q = selected?._id ? `?branchId=${selected._id}` : '';
      try { const s = await api.get('/reports/summary' + q); setData(s.data); }
      catch {} finally { setLoading(false); }
    })();
  }, [selected?._id]);

  const today = new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Page
      title="Bugungi smena"
      subtitle={`${today}${selected ? ` · ${selected.name}` : ''}${loading ? ' · yuklanmoqda...' : ''}`}
      actions={
        <>
          <Btn icon="cart" size="sm" onClick={() => navigate('/')}>Kassaga o'tish</Btn>
          <Btn variant="primary" icon="plus" size="sm" to="/mijozlar?new=1">Yangi mijoz</Btn>
        </>
      }
    >
      <div className="kpi-grid">
        <Kpi icon="wallet" label="Bugungi tushum" value={formatMoney(data?.todayTotal || 0)} />
        <Kpi icon="users"  label="Faol obunalar" value={data?.activeSubscriptions ?? 0} />
        <Kpi icon="cart"   label="Mijozlar" value={data?.totalCustomers ?? 0} />
        <Kpi icon="alert"  label="Qarz" value={formatMoney(data?.totalDebt || 0)} valueColor={(data?.totalDebt ?? 0) > 0 ? 'var(--danger)' : undefined} />
      </div>

      <div className="kg-card">
        <div className="kg-card-head"><h3>Tezkor harakatlar</h3></div>
        <div className="kg-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { icon: 'cart',  label: 'Kassa', to: '/',         desc: 'Sotuv va tashriflar' },
            { icon: 'users', label: 'Mijozlar', to: '/mijozlar', desc: 'Ro\'yxat va qarzlar' },
            { icon: 'chart', label: 'Hisobotlar', to: '/hisobotlar', desc: 'Bugun va o\'tgan kunlar' },
          ].map((q, i) => (
            <button key={i} onClick={() => navigate(q.to)} className="kg-card" style={{ padding: 18, textAlign: 'left', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--card)' }}>
              <Icon name={q.icon} size={22} style={{ color: 'var(--accent)' }} />
              <div style={{ fontWeight: 700, marginTop: 8 }}>{q.label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{q.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </Page>
  );
}

/* ---------- Helpers ---------- */
function Kpi({ icon, label, value, suffix, sub, delta, deltaDown, valueColor }) {
  return (
    <div className="kpi">
      <div className="lbl"><Icon name={icon} size={13} /> {label}</div>
      <div className="val" style={{ color: valueColor }}>
        {value}{suffix && <span className="cur"> {suffix}</span>}
      </div>
      {delta && (
        <div className={`delta ${deltaDown ? 'down' : ''}`}>
          <Icon name={deltaDown ? 'arrowDown' : 'arrowUp'} size={12} />
          {delta}{sub && <span className="muted"> {sub}</span>}
        </div>
      )}
      {!delta && sub && <div className="delta"><span className="muted">{sub}</span></div>}
    </div>
  );
}

function Empty({ msg, cta }) {
  return (
    <div className="empty" style={{ padding: 32 }}>
      <p>{msg}</p>
      {cta && <a href={cta.to} className="btn btn-primary btn-sm" style={{ display: 'inline-flex' }}><Icon name="plus" size={13} /> {cta.label}</a>}
    </div>
  );
}

function fmtCompact(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' mlrd';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + ' mln';
  if (n >= 1_000)         return (n / 1_000).toFixed(1) + ' ming';
  return formatMoney(n);
}
