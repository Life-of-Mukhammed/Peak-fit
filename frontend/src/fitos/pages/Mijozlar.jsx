import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Building2, Phone, MapPin, Tag, Plus, Trash2, Pencil, Search,
  Lock, Unlock, Clock, Calendar, ShieldAlert, Users,
} from 'lucide-react';
import { Card, Btn, IconBtn, Input, Select, Label, Modal, Empty, AddBtn, Stat, Badge, fmtUZ, fmtMoney } from '../ui';

const PERIODS = [
  { key: 'all',      label: 'Hammasi' },
  { key: 'demo',     label: 'Demodagilar', tone: 'amber' },
  { key: '1m',       label: '1 oylik',     tone: 'blue' },
  { key: '3m',       label: '3 oylik',     tone: 'blue' },
  { key: '6m',       label: '6 oylik',     tone: 'violet' },
  { key: '12m',      label: '12 oylik',    tone: 'emerald' },
  { key: 'one-time', label: 'Bir martalik', tone: 'rose' },
];

export default function Mijozlar() {
  const [period, setPeriod] = useState('all');
  const [clubs, setClubs] = useState([]);
  const [stats, setStats] = useState(null);
  const [regions, setRegions] = useState([]);
  const [services, setServices] = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [c, s, r, sv, t] = await Promise.all([
        api.get('/fitos/clubs', { params: period === 'all' ? {} : (period === 'demo' ? { status: 'demo' } : { paymentPeriod: period }) }),
        api.get('/fitos/clubs/stats'),
        api.get('/fitos/regions'),
        api.get('/fitos/services'),
        api.get('/fitos/tariffs'),
      ]);
      setClubs(c.data); setStats(s.data); setRegions(r.data); setServices(sv.data); setTariffs(t.data);
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [period]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clubs;
    const q = search.toLowerCase();
    return clubs.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.director?.toLowerCase().includes(q) ||
      c.phone?.includes(q),
    );
  }, [clubs, search]);

  const periodCount = (k) => {
    if (k === 'all') return stats?.total ?? 0;
    if (k === 'demo') return stats?.demo ?? 0;
    return stats?.byPeriod?.find(b => b._id === k)?.count ?? 0;
  };

  const blank = () => ({
    region: '', district: '', serviceType: '', name: '', director: '', phone: '', phoneAlt: '',
    tariff: '', branches: [{ name: '' }], status: 'demo', paymentPeriod: 'demo',
    demoUntil: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });

  const save = async (data) => {
    try {
      if (editing) await api.put(`/fitos/clubs/${editing._id}`, data);
      else await api.post('/fitos/clubs', data);
      toast.success(editing ? 'Yangilandi' : 'Yaratildi');
      setModal(null); setEditing(null);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
  };

  const block = async (c) => { await api.post(`/fitos/clubs/${c._id}/block`); load(); toast.success('Bloklandi'); };
  const unblock = async (c) => { await api.post(`/fitos/clubs/${c._id}/unblock`); load(); toast.success('Bloklash olindi'); };
  const extend = async (c) => {
    const d = prompt('Demoga necha kun qo‘shilsin?', '7');
    if (!d) return;
    await api.post(`/fitos/clubs/${c._id}/extend-demo`, { days: Number(d) || 7 });
    load(); toast.success('Demo uzaytirildi');
  };
  const remove = async (c) => {
    if (!confirm(`"${c.name}" klubini o‘chirasizmi?`)) return;
    await api.delete(`/fitos/clubs/${c._id}`);
    load(); toast.success('O‘chirildi');
  };

  const editRow = (c) => {
    setEditing(c);
    setModal({
      ...blank(),
      ...c,
      region:      c.region?._id || c.region || '',
      serviceType: c.serviceType?._id || c.serviceType || '',
      tariff:      c.tariff?._id || c.tariff || '',
      district:    c.district || '',
      branches:    c.branches?.length ? c.branches : [{ name: '' }],
      demoUntil:   c.demoUntil ? new Date(c.demoUntil).toISOString().slice(0, 10) : '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Jami klublar" value={stats?.total ?? 0} icon={Building2} accent="emerald" />
        <Stat label="Demoda" value={stats?.demo ?? 0} icon={Clock} accent="amber" />
        <Stat label="Aktiv" value={stats?.active ?? 0} icon={Users} accent="blue" />
        <Stat label="Bloklangan" value={stats?.blocked ?? 0} icon={ShieldAlert} accent="rose" />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {PERIODS.map(p => {
          const active = period === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border
                ${active ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
            >
              {p.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] tabular-nums ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {periodCount(p.key)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Klub, raxbar yoki telefon bo‘yicha qidirish..." className="pl-10" />
        </div>
        <AddBtn label="Mijoz yaratish" onClick={() => { setEditing(null); setModal(blank()); }} />
      </div>

      {loading ? (
        <Card className="p-12 text-center text-slate-400">Yuklanmoqda...</Card>
      ) : filtered.length === 0 ? (
        <Empty
          icon={Building2}
          title="Klub topilmadi"
          sub={search ? 'Qidiruv bo‘yicha hech narsa topilmadi' : 'Birinchi klubni qo‘shing'}
          action={!search && <AddBtn label="Mijoz yaratish" onClick={() => setModal(blank())} />}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(c => (
            <ClubCard
              key={c._id}
              c={c}
              onEdit={() => editRow(c)}
              onBlock={() => block(c)}
              onUnblock={() => unblock(c)}
              onExtend={() => extend(c)}
              onDelete={() => remove(c)}
            />
          ))}
        </div>
      )}

      {modal && (
        <ClubModal
          initial={modal}
          editing={!!editing}
          regions={regions}
          services={services}
          tariffs={tariffs}
          onClose={() => { setModal(null); setEditing(null); }}
          onSave={save}
        />
      )}
    </div>
  );
}

function ClubCard({ c, onEdit, onBlock, onUnblock, onExtend, onDelete }) {
  const statusTone = { demo: 'amber', active: 'emerald', blocked: 'rose', expired: 'slate' }[c.status] || 'slate';
  const statusLabel = { demo: 'Demo', active: 'Aktiv', blocked: 'Bloklangan', expired: 'Tugagan' }[c.status] || c.status;
  const periodLabel = { demo: 'Demo', '1m': '1 oy', '3m': '3 oy', '6m': '6 oy', '12m': '12 oy', 'one-time': 'Bir martalik' }[c.paymentPeriod] || c.paymentPeriod;

  return (
    <Card className="p-5 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-xl text-white flex items-center justify-center font-bold shadow-sm" style={{ background: c.tariff?.color || '#22c55e' }}>
            {c.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-bold text-slate-900 truncate">{c.name}</div>
              <Badge tone={statusTone}>{statusLabel}</Badge>
              <Badge tone="slate">{periodLabel}</Badge>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 truncate">{c.director}</div>
          </div>
        </div>
        {c.tariff && (
          <span className="text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wide" style={{ background: `${c.tariff.color}15`, color: c.tariff.color }}>
            {c.tariff.name}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <Info icon={MapPin} label={`${c.region?.name || ''} · ${c.districtName || ''}`} />
        <Info icon={Tag}    label={c.serviceType?.name || '—'} />
        <Info icon={Phone}  label={c.phone} />
        <Info icon={Building2} label={`${c.branches?.length || 0} ta filial`} />
      </div>

      {(c.demoUntil || c.paidUntil) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <Calendar size={12} className="text-slate-400" />
          {c.status === 'demo' && c.demoUntil && (
            <span className="text-amber-700">Demo: <b>{fmtUZ(c.demoUntil)}</b> gacha</span>
          )}
          {c.paidUntil && c.status !== 'demo' && (
            <span className="text-emerald-700">To‘langan: <b>{fmtUZ(c.paidUntil)}</b> gacha</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
        {c.status === 'demo' && <IconBtn icon={Clock} color="amber" onClick={onExtend} />}
        {c.status === 'blocked'
          ? <IconBtn icon={Unlock} color="emerald" onClick={onUnblock} />
          : <IconBtn icon={Lock} color="rose" onClick={onBlock} />
        }
        <IconBtn icon={Pencil} color="blue" onClick={onEdit} />
        <IconBtn icon={Trash2} color="rose" onClick={onDelete} />
      </div>
    </Card>
  );
}

const Info = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
    <Icon size={13} className="text-slate-400 flex-shrink-0" />
    <span className="truncate">{label || '—'}</span>
  </div>
);

function ClubModal({ initial, editing, regions, services, tariffs, onClose, onSave }) {
  const [f, setF] = useState(initial);

  const region = regions.find(r => r._id === f.region);
  const districts = region?.districts || [];
  const tariff = tariffs.find(t => t._id === f.tariff);
  const maxBranches = tariff?.limits?.branches || 1;

  // Reset district if region changes and the old district doesn't belong
  useEffect(() => {
    if (f.district && !districts.find(d => d._id === f.district)) {
      setF(p => ({ ...p, district: '' }));
    }
    // eslint-disable-next-line
  }, [f.region]);

  // Trim/expand branch slots when tariff changes
  useEffect(() => {
    setF(p => {
      const arr = [...(p.branches || [])];
      while (arr.length < 1) arr.push({ name: '' });
      while (arr.length > maxBranches) arr.pop();
      return { ...p, branches: arr };
    });
    // eslint-disable-next-line
  }, [f.tariff]);

  const setBranch = (i, v) => {
    const arr = [...f.branches];
    arr[i] = { ...arr[i], name: v };
    setF({ ...f, branches: arr });
  };
  const addBranch = () => f.branches.length < maxBranches && setF({ ...f, branches: [...f.branches, { name: '' }] });
  const removeBranch = (i) => setF({ ...f, branches: f.branches.filter((_, x) => x !== i) });

  const submit = () => {
    if (!f.region || !f.district || !f.serviceType || !f.name?.trim() || !f.director?.trim() || !f.phone?.trim() || !f.tariff) {
      return toast.error('Majburiy maydonlarni to‘ldiring');
    }
    const cleanBranches = f.branches.filter(b => b.name?.trim());
    onSave({ ...f, branches: cleanBranches });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'Klubni tahrirlash' : 'Yangi mijoz (klub)'}
      subtitle="Klub ma'lumotlari, tarif va filiallar"
      size="lg"
      footer={<>
        <Btn variant="outline" onClick={onClose}>Bekor</Btn>
        <Btn onClick={submit}>{editing ? 'Saqlash' : 'Yaratish'}</Btn>
      </>}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label required>Viloyat</Label>
            <Select value={f.region} onChange={e => setF({ ...f, region: e.target.value })}>
              <option value="">Tanlang...</option>
              {regions.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </Select>
          </div>
          <div>
            <Label required>Tuman / shahar</Label>
            <Select value={f.district} onChange={e => setF({ ...f, district: e.target.value })} disabled={!f.region}>
              <option value="">{f.region ? 'Tanlang...' : 'Avval viloyatni tanlang'}</option>
              {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </Select>
          </div>
          <div>
            <Label required>Xizmat turi</Label>
            <Select value={f.serviceType} onChange={e => setF({ ...f, serviceType: e.target.value })}>
              <option value="">Tanlang...</option>
              {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </Select>
          </div>
          <div>
            <Label required>Tarif</Label>
            <Select value={f.tariff} onChange={e => setF({ ...f, tariff: e.target.value })}>
              <option value="">Tanlang...</option>
              {tariffs.filter(t => t.isActive).map(t => (
                <option key={t._id} value={t._id}>
                  {t.name} — {fmtMoney(t.price)} so‘m ({t.limits?.branches || 1} filial)
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label required>Klub nomi</Label>
            <Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Astrum club" />
          </div>
          <div>
            <Label required>Raxbar ism familyasi</Label>
            <Input value={f.director} onChange={e => setF({ ...f, director: e.target.value })} placeholder="Ali Valiyev" />
          </div>
          <div>
            <Label required>Telefon raqam</Label>
            <Input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="+998 90 123 45 67" />
          </div>
          <div className="sm:col-span-2">
            <Label>Qo‘shimcha telefon</Label>
            <Input value={f.phoneAlt || ''} onChange={e => setF({ ...f, phoneAlt: e.target.value })} placeholder="ixtiyoriy" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="!mb-0">Filiallar ({f.branches.length} / {maxBranches})</Label>
            <button onClick={addBranch} disabled={f.branches.length >= maxBranches} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-30 flex items-center gap-1">
              <Plus size={13} /> Filial qo‘shish
            </button>
          </div>
          <div className="space-y-2">
            {f.branches.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-6">#{i + 1}</span>
                <Input value={b.name} onChange={e => setBranch(i, e.target.value)} placeholder={`Filial nomi (masalan: Astrum 24/7)`} />
                {f.branches.length > 1 && <IconBtn icon={Trash2} color="rose" onClick={() => removeBranch(i)} />}
              </div>
            ))}
          </div>
          {!f.tariff && <div className="text-xs text-slate-400 mt-2">Avval tarifni tanlang — filiallar soni tarifga bog‘liq</div>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Holat</Label>
            <Select value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
              <option value="demo">Demo</option>
              <option value="active">Aktiv</option>
              <option value="blocked">Bloklangan</option>
              <option value="expired">Tugagan</option>
            </Select>
          </div>
          <div>
            <Label>To‘lov davri</Label>
            <Select value={f.paymentPeriod} onChange={e => setF({ ...f, paymentPeriod: e.target.value })}>
              <option value="demo">Demo</option>
              <option value="1m">1 oylik</option>
              <option value="3m">3 oylik</option>
              <option value="6m">6 oylik</option>
              <option value="12m">12 oylik</option>
              <option value="one-time">Bir martalik</option>
            </Select>
          </div>
          <div>
            <Label>{f.status === 'demo' ? 'Demo tugaydi' : 'To‘langan davr oxiri'}</Label>
            <Input type="date" value={f.status === 'demo' ? (f.demoUntil || '').slice(0, 10) : (f.paidUntil || '').slice(0, 10)}
              onChange={e => setF({ ...f, [f.status === 'demo' ? 'demoUntil' : 'paidUntil']: e.target.value })} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
