import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Wallet, Plus, Trash2, Banknote, Calendar, TrendingUp, Building2 } from 'lucide-react';
import { Card, Btn, IconBtn, Input, Select, Label, Modal, Empty, AddBtn, Stat, Badge, fmtUZ, fmtMoney } from '../ui';

const PERIODS = [
  { key: 'all', label: 'Hammasi' },
  { key: '1m', label: '1 oylik' },
  { key: '3m', label: '3 oylik' },
  { key: '6m', label: '6 oylik' },
  { key: '12m', label: '12 oylik' },
  { key: 'one-time', label: 'Bir martalik' },
];

const PERIOD_TONE = { '1m': 'blue', '3m': 'blue', '6m': 'violet', '12m': 'emerald', 'one-time': 'rose' };

export default function Tolovlar() {
  const [period, setPeriod] = useState('all');
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [list, st, c, t] = await Promise.all([
        api.get('/fitos/payments', { params: period === 'all' ? {} : { period } }),
        api.get('/fitos/payments/stats'),
        api.get('/fitos/clubs'),
        api.get('/fitos/tariffs'),
      ]);
      setItems(list.data); setStats(st.data); setClubs(c.data); setTariffs(t.data);
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [period]);

  const periodCount = useMemo(() => {
    const map = { all: items.length };
    stats?.byPeriod?.forEach(p => { map[p._id] = p.count; });
    return map;
  }, [stats, items]);

  const save = async (data) => {
    try {
      await api.post('/fitos/payments', data);
      toast.success('To‘lov saqlandi');
      setModal(null); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
  };

  const remove = async (id) => {
    if (!confirm('To‘lovni o‘chirasizmi?')) return;
    await api.delete(`/fitos/payments/${id}`);
    load();
  };

  const blank = () => ({ club: '', tariff: '', period: '1m', amount: 0, note: '' });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Jami tushum" value={fmtMoney(stats?.totalAmount || 0) + ' so‘m'} icon={TrendingUp} accent="emerald" />
        <Stat label="To‘lovlar" value={items.length} icon={Wallet} accent="blue" />
        <Stat label="12 oylik" value={periodCount['12m'] || 0} icon={Calendar} accent="emerald" />
        <Stat label="Bir martalik" value={periodCount['one-time'] || 0} icon={Banknote} accent="rose" />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {PERIODS.map(p => {
          const active = period === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border
                ${active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
            >
              {p.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] tabular-nums ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {periodCount[p.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-end">
        <AddBtn label="To‘lov qo‘shish" onClick={() => setModal(blank())} />
      </div>

      {loading ? (
        <Card className="p-12 text-center text-slate-400">Yuklanmoqda...</Card>
      ) : items.length === 0 ? (
        <Empty icon={Wallet} title="To‘lov yo‘q" sub="Birinchi to‘lovni qayd qiling" />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50/70 border-b border-slate-100">
                <th className="px-5 py-3 font-semibold">Klub</th>
                <th className="px-5 py-3 font-semibold">Tarif</th>
                <th className="px-5 py-3 font-semibold">Davr</th>
                <th className="px-5 py-3 font-semibold text-right">Summa</th>
                <th className="px-5 py-3 font-semibold">To‘langan</th>
                <th className="px-5 py-3 font-semibold">Amalda</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(p => (
                <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-slate-900 text-sm">{p.club?.name || '—'}</div>
                    <div className="text-[11px] text-slate-500">{p.club?.director}</div>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-700">{p.tariff?.name || '—'}</td>
                  <td className="px-5 py-3"><Badge tone={PERIOD_TONE[p.period] || 'slate'}>{PERIODS.find(x => x.key === p.period)?.label || p.period}</Badge></td>
                  <td className="px-5 py-3 text-right font-bold text-slate-900 tabular-nums">{fmtMoney(p.amount)} <span className="text-xs text-slate-400 font-normal">so‘m</span></td>
                  <td className="px-5 py-3 text-sm text-slate-600">{fmtUZ(p.paidAt)}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{p.validUntil ? fmtUZ(p.validUntil) : '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <IconBtn icon={Trash2} color="rose" onClick={() => remove(p._id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {modal && <PaymentModal initial={modal} clubs={clubs} tariffs={tariffs} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}

function PaymentModal({ initial, clubs, tariffs, onClose, onSave }) {
  const [f, setF] = useState(initial);

  // Auto-suggest amount from selected tariff
  useEffect(() => {
    const t = tariffs.find(x => x._id === f.tariff);
    if (t && !f.amount) {
      const months = { '1m': 1, '3m': 3, '6m': 6, '12m': 12, 'one-time': 1 }[f.period] || 1;
      setF(p => ({ ...p, amount: t.price * months }));
    }
    // eslint-disable-next-line
  }, [f.tariff, f.period]);

  // Auto-pick club's tariff
  useEffect(() => {
    if (f.club && !f.tariff) {
      const c = clubs.find(x => x._id === f.club);
      if (c?.tariff?._id) setF(p => ({ ...p, tariff: c.tariff._id }));
    }
    // eslint-disable-next-line
  }, [f.club]);

  const submit = () => {
    if (!f.club || !f.period || !f.amount) return toast.error('Klub, davr va summa kerak');
    onSave(f);
  };

  return (
    <Modal
      open onClose={onClose}
      title="Yangi to‘lov"
      subtitle="Klubdan kelgan to‘lovni qayd qiling"
      size="md"
      footer={<><Btn variant="outline" onClick={onClose}>Bekor</Btn><Btn onClick={submit}>Saqlash</Btn></>}
    >
      <div className="space-y-4">
        <div>
          <Label required>Klub</Label>
          <Select value={f.club} onChange={e => setF({ ...f, club: e.target.value })}>
            <option value="">Tanlang...</option>
            {clubs.map(c => <option key={c._id} value={c._id}>{c.name} — {c.director}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Tarif</Label>
            <Select value={f.tariff} onChange={e => setF({ ...f, tariff: e.target.value })}>
              <option value="">Tanlang...</option>
              {tariffs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </Select>
          </div>
          <div>
            <Label required>Davr</Label>
            <Select value={f.period} onChange={e => setF({ ...f, period: e.target.value })}>
              <option value="1m">1 oylik</option>
              <option value="3m">3 oylik</option>
              <option value="6m">6 oylik</option>
              <option value="12m">12 oylik</option>
              <option value="one-time">Bir martalik</option>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label required>Summa (so‘m)</Label>
            <Input type="number" value={f.amount} onChange={e => setF({ ...f, amount: Number(e.target.value) || 0 })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Izoh</Label>
            <Input value={f.note} onChange={e => setF({ ...f, note: e.target.value })} placeholder="Ixtiyoriy" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
