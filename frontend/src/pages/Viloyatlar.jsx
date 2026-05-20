import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Page from '../components/kg/Page';
import Btn from '../components/kg/Btn';
import Badge from '../components/kg/Badge';
import Icon from '../components/kg/Icon';
import KgModal from '../components/kg/Modal';

const REGIONS = [
  { value: 'markaziy', label: 'Markaziy O\'zbekiston' },
  { value: 'shimoliy', label: 'Shimoliy' },
  { value: 'janubiy',  label: 'Janubiy' },
  { value: 'sharqiy',  label: 'Sharqiy (Farg\'ona vodiysi)' },
];

export default function Viloyatlar() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', region: 'markaziy', phoneCode: '+998' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await api.get('/provinces'); setItems(r.data); }
    catch { toast.error('Yuklab bo\'lmadi'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase()));

  const create = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      await api.post('/provinces', form);
      toast.success('Viloyat qo\'shildi');
      setModalOpen(false);
      setForm({ name: '', code: '', region: 'markaziy', phoneCode: '+998' });
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xato'); }
    finally { setSaving(false); }
  };

  const seedUZ = async () => {
    try {
      const r = await api.post('/provinces/seed-uz');
      toast.success(`Qo'shildi: ${r.data.inserted} / ${r.data.total}`);
      load();
    } catch { toast.error('Xato'); }
  };

  const remove = async (id) => {
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return;
    try { await api.delete(`/provinces/${id}`); toast.success('O\'chirildi'); load(); }
    catch (e) { toast.error(e.response?.data?.message || 'Xato'); }
  };

  return (
    <Page
      title="Viloyatlar"
      subtitle={loading ? 'Yuklanmoqda...' : `${items.length} ta viloyat`}
      actions={
        <>
          <Btn icon="download" size="sm">Eksport</Btn>
          <Btn variant="primary" icon="plus" size="sm" onClick={() => setModalOpen(true)}>Yangi viloyat</Btn>
        </>
      }
    >
      {!loading && items.length === 0 ? (
        <div className="kg-card">
          <div className="empty">
            <div className="empty-ico"><Icon name="map" size={26} /></div>
            <h3>Hozircha viloyatlar yo'q</h3>
            <p>Tarmoq boshqaruvini boshlash uchun avval kamida bitta viloyat qo'shing yoki O'zbekistonning tayyor 14 ta viloyat ro'yxatini import qiling.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
              <Btn variant="primary" icon="plus" onClick={() => setModalOpen(true)}>Birinchi viloyatni qo'shish</Btn>
              <Btn icon="download" onClick={seedUZ}>O'zbekiston ro'yxatini import qilish</Btn>
            </div>
          </div>
        </div>
      ) : (
        <div className="kg-card">
          <div className="kg-card-head">
            <div className="kg-search" style={{ position: 'static', margin: 0, width: 300 }}>
              <Icon name="search" size={16} />
              <input placeholder="Viloyat qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Btn size="sm" onClick={seedUZ} style={{ marginLeft: 'auto' }} icon="download">UZ-14 import</Btn>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="kg-table">
              <thead>
                <tr>
                  <th>Nomi</th>
                  <th>Kod</th>
                  <th>Hudud</th>
                  <th className="num">Tumanlar</th>
                  <th className="num">Clublar</th>
                  <th className="num">Dillerlar</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p._id}>
                    <td className="cell-strong">{p.name}</td>
                    <td className="num"><Badge>{p.code}</Badge></td>
                    <td>{REGIONS.find(r => r.value === p.region)?.label || p.region}</td>
                    <td className="num">{p.districtCount}</td>
                    <td className="num">{p.clubsCount}</td>
                    <td className="num">{p.dealersCount}</td>
                    <td>{p.isActive ? <Badge tone="success" dot>Faol</Badge> : <Badge tone="warn">Nofaol</Badge>}</td>
                    <td className="right">
                      <div className="row-actions">
                        <button className="ia" onClick={() => remove(p._id)} title="O'chirish"><Icon name="trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>Topilmadi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <KgModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Yangi viloyat qo'shish"
        subtitle="Viloyat ma'lumotlarini kiriting. Keyin tumanlar biriktirasiz."
        width={520}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Bekor qilish</button>
            <button className="btn btn-primary" onClick={create} disabled={saving || !form.name || !form.code}>
              <Icon name="check" size={14} /> {saving ? 'Saqlanmoqda...' : 'Yaratish'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Viloyat nomi <span className="req">*</span></label>
            <input className="kg-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Navoiy viloyati" />
          </div>
          <div className="field">
            <label>Qisqa kod <span className="req">*</span></label>
            <input className="kg-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().slice(0, 3) })} placeholder="NVI" style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }} />
            <div className="hint">3 ta harf</div>
          </div>
        </div>
        <div className="field">
          <label>Hudud</label>
          <select className="kg-select" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
            {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Telefon kodi</label>
          <input className="kg-input" value={form.phoneCode} onChange={(e) => setForm({ ...form, phoneCode: e.target.value })} style={{ fontFamily: 'var(--font-mono)' }} />
        </div>
      </KgModal>
    </Page>
  );
}
