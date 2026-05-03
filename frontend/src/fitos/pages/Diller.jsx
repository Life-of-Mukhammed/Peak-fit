import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Users2, Phone, Send as SendIcon, MapPin, Pencil, Trash2, Check } from 'lucide-react';
import { Card, Btn, IconBtn, Input, Select, Label, Modal, Empty, AddBtn, Stat, Badge } from '../ui';

const PERMS = [
  { key: 'canCreateClub',    label: 'Klub yaratish' },
  { key: 'canManageTariffs', label: 'Tariflarni boshqarish' },
  { key: 'canViewPayments',  label: 'To‘lovlarni ko‘rish' },
  { key: 'canBlockClub',     label: 'Klubni bloklash' },
  { key: 'canMessageClubs',  label: 'Klublarga xabar yuborish' },
];

export default function Diller() {
  const [items, setItems] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [d, r] = await Promise.all([api.get('/fitos/dealers'), api.get('/fitos/regions')]);
      setItems(d.data); setRegions(r.data);
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const blank = () => ({
    region: '', name: '', surname: '', phone: '', telegramUser: '',
    login: '', password: '', isActive: true,
    permissions: Object.fromEntries(PERMS.map(p => [p.key, false])),
  });

  const save = async (data) => {
    try {
      if (editing) await api.put(`/fitos/dealers/${editing._id}`, data);
      else await api.post('/fitos/dealers', data);
      toast.success(editing ? 'Yangilandi' : 'Yaratildi');
      setModal(null); setEditing(null); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
  };

  const remove = async (id) => {
    if (!confirm('Dillerni o‘chirasizmi?')) return;
    await api.delete(`/fitos/dealers/${id}`);
    load();
  };

  const editRow = (d) => {
    setEditing(d);
    setModal({
      ...blank(),
      ...d,
      region: d.region?._id || d.region || '',
      password: '',
      permissions: { ...blank().permissions, ...d.permissions },
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Dillerlar" value={items.length} icon={Users2} accent="emerald" />
        <Stat label="Faol" value={items.filter(d => d.isActive).length} icon={Check} accent="blue" />
        <Stat label="Hududlar" value={new Set(items.map(d => d.region?._id).filter(Boolean)).size} icon={MapPin} accent="amber" />
      </div>

      <div className="flex items-center justify-end">
        <AddBtn label="Diller qo‘shish" onClick={() => { setEditing(null); setModal(blank()); }} />
      </div>

      {loading ? (
        <Card className="p-12 text-center text-slate-400">Yuklanmoqda...</Card>
      ) : items.length === 0 ? (
        <Empty icon={Users2} title="Diller yo‘q" sub="Hududiy dillerlarni qo‘shing va ruxsatlarini belgilang" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map(d => (
            <Card key={d._id} className="p-5 hover:shadow-md transition-all group">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center font-bold">
                  {d.name?.[0]}{d.surname?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900">{d.name} {d.surname}</div>
                  <div className="text-xs text-slate-500">@{d.login}</div>
                </div>
                {!d.isActive && <Badge tone="rose">Faol emas</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Info icon={MapPin} label={d.region?.name || '—'} />
                <Info icon={Phone} label={d.phone} />
                {d.telegramUser && <Info icon={SendIcon} label={'@' + d.telegramUser.replace(/^@/, '')} />}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {PERMS.filter(p => d.permissions?.[p.key]).map(p => (
                  <span key={p.key} className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">{p.label}</span>
                ))}
                {!PERMS.some(p => d.permissions?.[p.key]) && <span className="text-[11px] text-slate-400">Ruxsatlar belgilanmagan</span>}
              </div>
              <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <IconBtn icon={Pencil} color="blue" onClick={() => editRow(d)} />
                <IconBtn icon={Trash2} color="rose" onClick={() => remove(d._id)} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal && <DealerModal initial={modal} editing={!!editing} regions={regions} onClose={() => { setModal(null); setEditing(null); }} onSave={save} />}
    </div>
  );
}

const Info = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
    <Icon size={13} className="text-slate-400 flex-shrink-0" />
    <span className="truncate">{label || '—'}</span>
  </div>
);

function DealerModal({ initial, editing, regions, onClose, onSave }) {
  const [f, setF] = useState(initial);
  const togglePerm = (k) => setF({ ...f, permissions: { ...f.permissions, [k]: !f.permissions?.[k] } });

  const submit = () => {
    if (!f.name?.trim() || !f.surname?.trim() || !f.phone?.trim() || !f.login?.trim()) {
      return toast.error('Majburiy maydonlarni to‘ldiring');
    }
    if (!editing && !f.password) return toast.error('Parol kiriting');
    onSave(f);
  };

  return (
    <Modal
      open onClose={onClose}
      title={editing ? 'Dillerni tahrirlash' : 'Yangi diller'}
      subtitle="Hudud, login/parol va ruxsatlarni belgilang"
      size="lg"
      footer={<><Btn variant="outline" onClick={onClose}>Bekor</Btn><Btn onClick={submit}>Saqlash</Btn></>}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Viloyat</Label>
            <Select value={f.region} onChange={e => setF({ ...f, region: e.target.value })}>
              <option value="">Tanlang...</option>
              {regions.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Telegram username</Label>
            <Input value={f.telegramUser} onChange={e => setF({ ...f, telegramUser: e.target.value })} placeholder="@username" />
          </div>
          <div>
            <Label required>Ism</Label>
            <Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          </div>
          <div>
            <Label required>Familya</Label>
            <Input value={f.surname} onChange={e => setF({ ...f, surname: e.target.value })} />
          </div>
          <div>
            <Label required>Telefon</Label>
            <Input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="+998 ..." />
          </div>
          <div>
            <Label required>Login</Label>
            <Input value={f.login} onChange={e => setF({ ...f, login: e.target.value })} disabled={editing} />
          </div>
          <div className="sm:col-span-2">
            <Label>{editing ? 'Yangi parol (ixtiyoriy)' : 'Parol'}</Label>
            <Input type="text" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} placeholder={editing ? 'O‘zgartirmaslik uchun bo‘sh qoldiring' : ''} />
          </div>
        </div>

        <div>
          <Label>Ruxsatlar</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PERMS.map(p => {
              const on = !!f.permissions?.[p.key];
              return (
                <button
                  key={p.key} type="button" onClick={() => togglePerm(p.key)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all ${on ? 'border-emerald-500/50 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${on ? 'bg-emerald-500 text-white' : 'border border-slate-300'}`}>
                    {on && <Check size={12} />}
                  </div>
                  <span className={`text-sm font-medium flex-1 ${on ? 'text-emerald-900' : 'text-slate-700'}`}>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={f.isActive} onChange={e => setF({ ...f, isActive: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
          <span className="text-sm text-slate-700 font-medium">Diller faol</span>
        </label>
      </div>
    </Modal>
  );
}
