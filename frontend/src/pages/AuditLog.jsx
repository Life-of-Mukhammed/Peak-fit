import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Page from '../components/kg/Page';
import Btn from '../components/kg/Btn';
import Badge from '../components/kg/Badge';
import Icon from '../components/kg/Icon';

const ACTION_LABELS = {
  create:   { label: 'Yaratdi',     tone: 'success' },
  update:   { label: 'Tahrirladi',  tone: 'info' },
  delete:   { label: 'O\'chirdi',   tone: 'danger' },
  export:   { label: 'Eksport',     tone: 'default' },
  auth:     { label: 'Kirish',      tone: 'default' },
  auth_fail:{ label: 'Kirish xato', tone: 'danger' },
  system:   { label: 'Tizim',       tone: 'default' },
};

export default function AuditLog() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set('search', search);
      if (actionFilter) q.set('action', actionFilter);
      q.set('limit', 300);
      const r = await api.get(`/audit?${q}`);
      setItems(r.data);
    } catch { toast.error('Yuklab bo\'lmadi'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [actionFilter]);

  const exportCsv = () => {
    const rows = [['Vaqt', 'Foydalanuvchi', 'Harakat', 'Tavsif', 'Obyekt', 'IP'].join(',')];
    items.forEach(a => {
      rows.push([
        new Date(a.createdAt).toISOString(),
        `"${a.userName}"`,
        a.action,
        `"${(a.description || '').replace(/"/g, '""')}"`,
        `"${a.object || ''}"`,
        a.ip || '',
      ].join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Page
      title="Audit log"
      subtitle={loading ? 'Yuklanmoqda...' : `${items.length} ta yozuv`}
      actions={
        <>
          <Btn icon="download" size="sm" onClick={exportCsv}>CSV eksport</Btn>
        </>
      }
    >
      <div className="kg-card">
        <div className="kg-card-head">
          <div className="kg-search" style={{ position: 'static', margin: 0, width: 280 }}>
            <Icon name="search" size={16} />
            <input placeholder="Foydalanuvchi yoki harakat" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
          </div>
          <select className="kg-select" style={{ width: 200, height: 34 }} value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="">Harakat turi: Hammasi</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="kg-table">
            <thead>
              <tr>
                <th style={{ width: 160 }}>Vaqt</th>
                <th>Foydalanuvchi</th>
                <th>Harakat</th>
                <th>Tavsif</th>
                <th>Obyekt</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {items.map(a => {
                const meta = ACTION_LABELS[a.action] || { label: a.action, tone: 'default' };
                return (
                  <tr key={a._id}>
                    <td className="num muted">{new Date(a.createdAt).toLocaleString('uz-UZ')}</td>
                    <td className="cell-strong">{a.userName}</td>
                    <td><Badge tone={meta.tone}>{meta.label}</Badge></td>
                    <td>{a.description}</td>
                    <td className="muted">{a.object}</td>
                    <td className="num muted" style={{ fontSize: 11 }}>{a.ip}</td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>Yozuvlar yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Page>
  );
}
