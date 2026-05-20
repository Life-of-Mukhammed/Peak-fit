import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Tag, Pencil, Trash2, Check, Building2, UserCog, Users,
  Package, BarChart2, Banknote, Camera, ScanLine, Monitor,
  Coffee, MessageCircle, Send,
} from 'lucide-react';
import { Card, Btn, IconBtn, Input, Label, Modal, Empty, AddBtn, Stat, fmtMoney } from '../ui';

const FEATURES = [
  { key: 'inventory',        label: 'Inventarizatsiya',  icon: Package },
  { key: 'reports3Months',   label: '3 oylik hisobot',   icon: BarChart2 },
  { key: 'reportsUnlimited', label: 'Cheksiz hisobot',   icon: BarChart2 },
  { key: 'debt',             label: 'Qarzga ishlash',    icon: Banknote },
  { key: 'camera',           label: 'Kamera orqali',     icon: Camera },
  { key: 'scanner',          label: 'Skaner orqali',     icon: ScanLine },
  { key: 'computerOnly',     label: 'Faqat komp.dan',    icon: Monitor },
  { key: 'bar',              label: 'Bardan foydalanish',icon: Coffee },
  { key: 'sms',              label: 'SMS xabar',         icon: MessageCircle },
  { key: 'telegram',         label: 'Telegram xabar',    icon: Send },
];

const LIMITS = [
  { key: 'branches',  label: 'Filiallar',     icon: Building2 },
  { key: 'employees', label: 'Xodimlar',      icon: UserCog },
  { key: 'admins',    label: 'Adminlar',      icon: UserCog },
  { key: 'customers', label: 'Mijozlar',      icon: Users },
];

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#10b981'];

export default function Tariflar() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setItems((await api.get('/fitos/tariffs')).data); }
    catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const blank = () => ({
    name: '', price: 0, description: '', color: COLORS[0], isActive: true, sort: items.length,
    limits: { branches: 1, employees: 1, customers: 100, admins: 1 },
    features: Object.fromEntries(FEATURES.map(f => [f.key, f.key === 'computerOnly'])),
  });

  const save = async (data) => {
    try {
      if (editing) await api.put(`/fitos/tariffs/${editing._id}`, data);
      else await api.post('/fitos/tariffs', data);
      toast.success(editing ? 'Yangilandi' : 'Qo‘shildi');
      setModal(null); setEditing(null);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
  };

  const remove = async (id) => {
    if (!confirm('Tarifni o‘chirasizmi?')) return;
    await api.delete(`/fitos/tariffs/${id}`);
    toast.success('O‘chirildi');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Tariflar" value={items.length} icon={Tag} accent="emerald" />
        <Stat label="Faol" value={items.filter(t => t.isActive).length} icon={Check} accent="blue" />
        <Stat label="Eng arzon" value={items.length ? fmtMoney(Math.min(...items.map(t => t.price || 0))) + ' so‘m' : '—'} icon={Tag} accent="amber" />
      </div>

      <div className="flex items-center justify-end">
        <AddBtn onClick={() => { setEditing(null); setModal(blank()); }} label="Tarif yaratish" />
      </div>

      {loading ? (
        <Card className="p-12 text-center text-slate-400">Yuklanmoqda...</Card>
      ) : items.length === 0 ? (
        <Empty icon={Tag} title="Tarif yo‘q" sub="Klub imkoniyatlaridan kelib chiqib tarif yarating (Start, Premium va h.k.)" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(t => (
            <TariffCard key={t._id} t={t} onEdit={() => { setEditing(t); setModal({ ...blank(), ...t, features: { ...blank().features, ...t.features }, limits: { ...blank().limits, ...t.limits } }); }} onDelete={() => remove(t._id)} />
          ))}
        </div>
      )}

      {modal && <TariffModal initial={modal} editing={!!editing} onClose={() => { setModal(null); setEditing(null); }} onSave={save} />}
    </div>
  );
}

function TariffCard({ t, onEdit, onDelete }) {
  const enabled = FEATURES.filter(f => t.features?.[f.key]);
  return (
    <Card className="overflow-hidden flex flex-col group">
      <div className="px-5 pt-5 pb-4 relative">
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: t.color || '#22c55e' }} />
        <div className="flex items-start justify-between gap-3 mt-1">
          <div className="min-w-0">
            <div className="font-bold text-slate-900 text-lg truncate">{t.name}</div>
            {t.description && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</div>}
          </div>
          {!t.isActive && <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-semibold">PASSIV</span>}
        </div>
        <div className="mt-4">
          <div className="text-3xl font-extrabold text-slate-900 tabular-nums">{fmtMoney(t.price)}<span className="text-base font-medium text-slate-400 ml-1">so‘m</span></div>
        </div>
      </div>
      <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/40 grid grid-cols-2 gap-2">
        {LIMITS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            <Icon size={13} className="text-slate-400" />
            <span className="text-slate-500">{label}:</span>
            <span className="font-semibold text-slate-900 tabular-nums">{t.limits?.[key] ?? '—'}</span>
          </div>
        ))}
      </div>
      <div className="px-5 py-4 flex-1">
        <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-2">Imkoniyatlar</div>
        <div className="space-y-1.5">
          {enabled.length === 0 && <div className="text-xs text-slate-400">Imkoniyat tanlanmagan</div>}
          {enabled.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center gap-2 text-xs text-slate-700">
              <div className="w-4 h-4 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Check size={10} />
              </div>
              <Icon size={12} className="text-slate-400" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <IconBtn icon={Pencil} color="blue" onClick={onEdit} />
        <IconBtn icon={Trash2} color="rose" onClick={onDelete} />
      </div>
    </Card>
  );
}

function TariffModal({ initial, editing, onClose, onSave }) {
  const [f, setF] = useState(initial);
  const setLimit = (k, v) => setF({ ...f, limits: { ...f.limits, [k]: Number(v) || 0 } });
  const toggleFeature = (k) => setF({ ...f, features: { ...f.features, [k]: !f.features?.[k] } });

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'Tarifni tahrirlash' : 'Yangi tarif'}
      subtitle="Tarif imkoniyatlari va cheklovlarini belgilang"
      size="lg"
      footer={<>
        <Btn variant="outline" onClick={onClose}>Bekor</Btn>
        <Btn onClick={() => f.name?.trim() && onSave(f)}>Saqlash</Btn>
      </>}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label required>Nom</Label>
            <Input autoFocus value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Start / Premium / Enterprise" />
          </div>
          <div>
            <Label>Narx (so‘m)</Label>
            <Input type="number" value={f.price} onChange={e => setF({ ...f, price: Number(e.target.value) || 0 })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Tavsif</Label>
            <Input value={f.description || ''} onChange={e => setF({ ...f, description: e.target.value })} placeholder="Tarif haqida qisqacha" />
          </div>
          <div className="sm:col-span-2">
            <Label>Rang</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setF({ ...f, color: c })}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${f.color === c ? 'ring-2 ring-offset-2 ring-emerald-500 border-white' : 'border-white shadow-sm'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={f.isActive} onChange={e => setF({ ...f, isActive: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
              <span className="text-sm text-slate-700 font-medium">Tarif faol</span>
            </label>
          </div>
        </div>

        <div>
          <Label>Cheklovlar</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {LIMITS.map(({ key, label, icon: Icon }) => (
              <div key={key} className="border border-slate-200 rounded-xl p-3 bg-slate-50/40">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold mb-1.5">
                  <Icon size={12} /> {label}
                </div>
                <Input type="number" value={f.limits?.[key] ?? 0} onChange={e => setLimit(key, e.target.value)} className="!py-1.5 !text-sm font-semibold tabular-nums" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Imkoniyatlar (feature flags)</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FEATURES.map(({ key, label, icon: Icon }) => {
              const on = !!f.features?.[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleFeature(key)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all ${on ? 'border-emerald-500/50 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${on ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Icon size={15} />
                  </div>
                  <span className={`text-sm font-medium flex-1 ${on ? 'text-emerald-900' : 'text-slate-700'}`}>{label}</span>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${on ? 'bg-emerald-500 text-white' : 'border border-slate-300'}`}>
                    {on && <Check size={12} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
