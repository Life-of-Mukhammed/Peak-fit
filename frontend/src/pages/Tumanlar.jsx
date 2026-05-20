import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Page from '../components/kg/Page';
import Btn from '../components/kg/Btn';
import Badge from '../components/kg/Badge';
import Icon from '../components/kg/Icon';
import KgModal from '../components/kg/Modal';

const TYPES = [
  { value: 'shahar_tumani', label: 'Shahar tumani' },
  { value: 'qishloq',       label: 'Qishloq tumani' },
  { value: 'shahar',        label: 'Shahar' },
];

export default function Tumanlar() {
  const [items, setItems] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [search, setSearch] = useState('');
  const [provFilter, setProvFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', province: '', type: 'shahar_tumani', population: 0, dealer: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [d, p, dl] = await Promise.all([
        api.get('/districts'),
        api.get('/provinces'),
        api.get('/dealers').catch(() => ({ data: [] })),
      ]);
      setItems(d.data);
      setProvinces(p.data);
      setDealers(dl.data || []);
    } catch { toast.error('Yuklab bo\'lmadi'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(i => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (provFilter && String(i.province?._id) !== provFilter) return false;
    return true;
  });

  const create = async () => {
    if (!form.name || !form.province) return toast.error('Tuman nomi va viloyat majburiy');
    setSaving(true);
    try {
      await api.post('/districts', {
        ...form,
        dealer: form.dealer || null,
        population: Number(form.population) || 0,
      });
      toast.success('Tuman qo\'shildi');
      setModalOpen(false);
      setForm({ name: '', province: '', type: 'shahar_tumani', population: 0, dealer: '' });
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xato'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return;
    try { await api.delete(`/districts/${id}`); toast.success('O\'chirildi'); load(); }
    catch (e) { toast.error(e.response?.data?.message || 'Xato'); }
  };

  return (
    <Page
      title="Tumanlar"
      subtitle={loading ? 'Yuklanmoqda...' : `${items.length} ta tuman · ${provinces.length} viloyatda`}
      actions={
        <>
          <Btn icon="download" size="sm">Eksport</Btn>
          <Btn variant="primary" icon="plus" size="sm" onClick={() => setModalOpen(true)} disabled={!provinces.length}>Yangi tuman</Btn>
        </>
      }
    >
      {!provinces.length && !loading && (
        <div className="kg-card" style={{ padding: 16, marginBottom: 16, background: 'var(--warn-soft)', borderColor: 'var(--warn)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'var(--warn)' }}>
            <Icon name="alert" size={18} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>Avval viloyat qo'shing</div>
              <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>Tumanlarni biriktirish uchun kamida bitta viloyat kerak.</div>
            </div>
            <Btn variant="primary" size="sm" to="/viloyatlar">Viloyatlarga o'tish</Btn>
          </div>
        </div>
      )}

      <div className="kg-card">
        <div className="kg-card-head">
          <div className="kg-search" style={{ position: 'static', margin: 0, width: 280 }}>
            <Icon name="search" size={16} />
            <input placeholder="Tuman qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="kg-select" style={{ width: 220, height: 34 }} value={provFilter} onChange={(e) => setProvFilter(e.target.value)}>
            <option value="">Viloyat: Hammasi</option>
            {provinces.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="kg-table">
            <thead>
              <tr>
                <th>Tuman</th>
                <th>Viloyat</th>
                <th>Turi</th>
                <th>Mas'ul diller</th>
                <th className="num">Aholisi</th>
                <th className="num">Clublar</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d._id}>
                  <td className="cell-strong" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="pin" size={14} style={{ color: 'var(--muted)' }} />
                    {d.name}
                  </td>
                  <td>{d.province?.name || '—'} {d.province?.code && <Badge style={{ marginLeft: 6 }}>{d.province.code}</Badge>}</td>
                  <td>{TYPES.find(t => t.value === d.type)?.label || d.type}</td>
                  <td>{d.dealer ? `${d.dealer.firstName} ${d.dealer.lastName}` : <span className="muted">— Biriktirilmagan —</span>}</td>
                  <td className="num">{d.population ? d.population.toLocaleString() : '—'}</td>
                  <td className="num">{d.clubsCount}</td>
                  <td className="right"><button className="ia" onClick={() => remove(d._id)}><Icon name="trash" /></button></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>Tumanlar yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <KgModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Yangi tumanni biriktirish"
        subtitle="Tumanni viloyatga va mas'ul dillerga biriktiring"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Bekor qilish</button>
            <button className="btn btn-primary" onClick={create} disabled={saving}>
              <Icon name="check" size={14} /> {saving ? 'Saqlanmoqda...' : 'Tumanni qo\'shish'}
            </button>
          </>
        }
      >
        <div className="field">
          <label>Viloyat <span className="req">*</span></label>
          <select className="kg-select" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}>
            <option value="">— Tanlang —</option>
            {provinces.map(p => <option key={p._id} value={p._id}>{p.name} ({p.code})</option>)}
          </select>
        </div>
        <div className="field">
          <label>Tuman nomi <span className="req">*</span></label>
          <input className="kg-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Chilonzor tumani" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Turi</label>
            <select className="kg-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Aholisi (taxminiy)</label>
            <input className="kg-input" type="number" value={form.population} onChange={(e) => setForm({ ...form, population: e.target.value })} style={{ fontFamily: 'var(--font-mono)' }} />
          </div>
        </div>
        <div className="field">
          <label>Mas'ul diller</label>
          <select className="kg-select" value={form.dealer} onChange={(e) => setForm({ ...form, dealer: e.target.value })}>
            <option value="">— Hozircha biriktirilmagan —</option>
            {dealers.map(d => <option key={d._id} value={d._id}>{d.firstName} {d.lastName} ({d.commissionRate}%)</option>)}
          </select>
          <div className="hint">Keyinroq Dillerlar bo'limidan o'zgartirsa bo'ladi</div>
        </div>
      </KgModal>
    </Page>
  );
}
