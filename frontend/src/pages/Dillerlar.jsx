import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Page from '../components/kg/Page';
import Btn from '../components/kg/Btn';
import Badge from '../components/kg/Badge';
import Icon from '../components/kg/Icon';
import KgModal from '../components/kg/Modal';

export default function Dillerlar() {
  const [items, setItems] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [search, setSearch] = useState('');
  const [provFilter, setProvFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  function emptyForm() {
    return {
      firstName: '', lastName: '', phone: '', email: '', passport: '',
      province: '', districts: [], commissionRate: 8, firstMonthBonus: 80,
    };
  }

  const load = async () => {
    setLoading(true);
    try {
      const [d, p, di] = await Promise.all([
        api.get('/dealers'),
        api.get('/provinces').catch(() => ({ data: [] })),
        api.get('/districts').catch(() => ({ data: [] })),
      ]);
      setItems(d.data);
      setProvinces(p.data || []);
      setDistricts(di.data || []);
    } catch { toast.error('Yuklab bo\'lmadi'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(i => {
    if (search) {
      const q = search.toLowerCase();
      if (!`${i.firstName} ${i.lastName} ${i.phone}`.toLowerCase().includes(q)) return false;
    }
    if (provFilter && String(i.province?._id) !== provFilter) return false;
    if (statusFilter && i.status !== statusFilter) return false;
    return true;
  });

  const filteredDistricts = districts.filter(d => !form.province || String(d.province?._id || d.province) === form.province);

  const create = async () => {
    if (!form.firstName || !form.lastName || !form.phone) return toast.error('Ism, familiya, telefon majburiy');
    setSaving(true);
    try {
      await api.post('/dealers', {
        ...form,
        province: form.province || null,
        commissionRate: Number(form.commissionRate),
        firstMonthBonus: Number(form.firstMonthBonus),
      });
      toast.success('Diller qo\'shildi');
      setModalOpen(false);
      setForm(emptyForm());
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xato'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return;
    try { await api.delete(`/dealers/${id}`); toast.success('O\'chirildi'); load(); }
    catch (e) { toast.error(e.response?.data?.message || 'Xato'); }
  };

  const activeCount = items.filter(i => i.status === 'faol').length;
  const totalClubs = items.reduce((s, i) => s + (i.clubsCount || 0), 0);
  const avgCommission = items.length ? (items.reduce((s, i) => s + (i.commissionRate || 0), 0) / items.length).toFixed(1) : 0;

  return (
    <Page
      title="Dillerlar"
      subtitle={loading ? 'Yuklanmoqda...' : `${items.length} ta diller · ${activeCount} faol`}
      actions={
        <>
          <Btn icon="download" size="sm">Eksport</Btn>
          <Btn variant="primary" icon="plus" size="sm" onClick={() => setModalOpen(true)}>Yangi diller</Btn>
        </>
      }
    >
      <div className="kpi-grid">
        <Kpi icon="handshake" label="Jami dillerlar" value={items.length} sub={`${activeCount} faol`} />
        <Kpi icon="building"  label="Ular orqali clublar" value={totalClubs} />
        <Kpi icon="wallet"    label="O'rtacha komission" value={`${avgCommission}%`} />
        <Kpi icon="trend"     label="Faol viloyatlar" value={new Set(items.map(i => String(i.province?._id))).size} />
      </div>

      <div className="kg-card">
        <div className="kg-card-head" style={{ flexWrap: 'wrap', gap: 8 }}>
          <div className="kg-search" style={{ position: 'static', margin: 0, width: 260 }}>
            <Icon name="search" size={16} />
            <input placeholder="Diller FIO yoki telefon" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="kg-select" style={{ width: 200, height: 34 }} value={provFilter} onChange={(e) => setProvFilter(e.target.value)}>
            <option value="">Viloyat: Hammasi</option>
            {provinces.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <select className="kg-select" style={{ width: 160, height: 34 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Holat: Hammasi</option>
            <option value="faol">Faol</option>
            <option value="sust">Sust</option>
            <option value="bloklangan">Bloklangan</option>
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="kg-table">
            <thead>
              <tr>
                <th>Diller</th>
                <th>Viloyat</th>
                <th>Tumanlar</th>
                <th className="num">Clublar</th>
                <th className="num">Komission %</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="kg-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                        {d.firstName?.[0]}{d.lastName?.[0]}
                      </div>
                      <div>
                        <div className="cell-strong">{d.firstName} {d.lastName}</div>
                        <div className="muted" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{d.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td>{d.province?.name || '—'}</td>
                  <td className="muted">{d.districts?.length || 0} ta</td>
                  <td className="num">{d.clubsCount}</td>
                  <td className="num">{d.commissionRate}%</td>
                  <td>
                    {d.status === 'faol' && <Badge tone="success" dot>Faol</Badge>}
                    {d.status === 'sust' && <Badge tone="warn">Sust</Badge>}
                    {d.status === 'bloklangan' && <Badge tone="danger">Bloklangan</Badge>}
                  </td>
                  <td className="right"><button className="ia" onClick={() => remove(d._id)}><Icon name="trash" /></button></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>
                  Dillerlar yo'q. <a onClick={() => setModalOpen(true)} style={{ color: 'var(--accent-hover)', cursor: 'pointer', fontWeight: 600 }}>+ Birinchisini qo'shish</a>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <KgModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Yangi dillerni qo'shish"
        subtitle="Diller hisobini administrator yaratadi. Foydalanuvchi nomi va parol keyinroq beriladi."
        width={580}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Bekor qilish</button>
            <button className="btn btn-primary" onClick={create} disabled={saving}>
              <Icon name="check" size={14} /> {saving ? 'Saqlanmoqda...' : 'Dillerni yaratish'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Ism <span className="req">*</span></label>
            <input className="kg-input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Sanjar" />
          </div>
          <div className="field">
            <label>Familiya <span className="req">*</span></label>
            <input className="kg-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="O'rinov" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Telefon <span className="req">*</span></label>
            <div className="input-wrap">
              <Icon name="phone" size={14} className="pfx" />
              <input className="kg-input with-prefix" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998 90 555 12 34" style={{ fontFamily: 'var(--font-mono)' }} />
            </div>
          </div>
          <div className="field">
            <label>Email</label>
            <div className="input-wrap">
              <Icon name="mail" size={14} className="pfx" />
              <input className="kg-input with-prefix" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="sanjar@kigo.uz" />
            </div>
          </div>
        </div>
        <div className="field">
          <label>Passport / ID</label>
          <input className="kg-input" value={form.passport} onChange={(e) => setForm({ ...form, passport: e.target.value })} placeholder="AB 1234567" style={{ fontFamily: 'var(--font-mono)' }} />
        </div>
        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
        <div className="field">
          <label>Mas'ul viloyat</label>
          <select className="kg-select" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value, districts: [] })}>
            <option value="">— Tanlang —</option>
            {provinces.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Mas'ul tumanlar (ko'p tanlash)</label>
          <select multiple className="kg-select" style={{ height: 100 }} value={form.districts} onChange={(e) => {
            const v = Array.from(e.target.selectedOptions).map(o => o.value);
            setForm({ ...form, districts: v });
          }}>
            {filteredDistricts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Komission % <span className="req">*</span></label>
            <input className="kg-input" type="number" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} style={{ fontFamily: 'var(--font-mono)' }} />
            <div className="hint">Mijoz to'lovidan dillerga o'tadigan foiz</div>
          </div>
          <div className="field">
            <label>1-oy bonus %</label>
            <input className="kg-input" type="number" value={form.firstMonthBonus} onChange={(e) => setForm({ ...form, firstMonthBonus: e.target.value })} style={{ fontFamily: 'var(--font-mono)' }} />
            <div className="hint">Yangi mijozning birinchi to'lovi uchun</div>
          </div>
        </div>
      </KgModal>
    </Page>
  );
}

function Kpi({ icon, label, value, sub }) {
  return (
    <div className="kpi">
      <div className="lbl"><Icon name={icon} size={13} /> {label}</div>
      <div className="val">{value}</div>
      {sub && <div className="delta"><span className="muted">{sub}</span></div>}
    </div>
  );
}
