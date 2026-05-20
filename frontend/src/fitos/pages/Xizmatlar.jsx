import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Layers, Pencil, Trash2, Dumbbell, Gamepad2, Target, Activity, Trophy, Footprints } from 'lucide-react';
import { Card, Btn, IconBtn, Input, Label, Modal, Empty, AddBtn, Stat } from '../ui';

const ICONS = {
  dumbbell: Dumbbell, gamepad: Gamepad2, target: Target, activity: Activity, trophy: Trophy, footprints: Footprints, layers: Layers,
};

export default function Xizmatlar() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setItems((await api.get('/fitos/services')).data); }
    catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async (data) => {
    try {
      if (editing) await api.put(`/fitos/services/${editing._id}`, data);
      else await api.post('/fitos/services', data);
      toast.success(editing ? 'Yangilandi' : 'Qo‘shildi');
      setModal(null); setEditing(null);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
  };

  const remove = async (id) => {
    if (!confirm('Xizmat turini o‘chirasizmi?')) return;
    await api.delete(`/fitos/services/${id}`);
    toast.success('O‘chirildi');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Stat label="Xizmat turlari" value={items.length} icon={Layers} accent="emerald" />
        <Card className="p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Misol uchun</div>
          <div className="flex flex-wrap gap-2">
            {['Fitness club', 'Game club', 'Sport zal', 'Bodybuilding'].map(x => (
              <span key={x} className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">{x}</span>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-end">
        <AddBtn onClick={() => { setEditing(null); setModal({ name: '', description: '', icon: 'dumbbell' }); }} label="Xizmat yaratish" />
      </div>

      {loading ? (
        <Card className="p-12 text-center text-slate-400">Yuklanmoqda...</Card>
      ) : items.length === 0 ? (
        <Empty icon={Layers} title="Xizmat turi yo‘q" sub="Birinchi xizmat turini yarating (Fitness, Game club va h.k.)" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(s => {
            const Icon = ICONS[s.icon] || Layers;
            return (
              <Card key={s._id} className="p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-emerald-600 flex items-center justify-center">
                    <Icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{s.name}</div>
                    {s.description && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconBtn icon={Pencil} color="blue" onClick={() => { setEditing(s); setModal({ ...s }); }} />
                  <IconBtn icon={Trash2} color="rose" onClick={() => remove(s._id)} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {modal && <ServiceModal initial={modal} editing={!!editing} onClose={() => { setModal(null); setEditing(null); }} onSave={save} />}
    </div>
  );
}

function ServiceModal({ initial, editing, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'Xizmat turini tahrirlash' : 'Yangi xizmat turi'}
      subtitle="Klublar shu turlardan birini tanlaydi"
      size="sm"
      footer={<>
        <Btn variant="outline" onClick={onClose}>Bekor</Btn>
        <Btn onClick={() => form.name?.trim() && onSave(form)}>Saqlash</Btn>
      </>}
    >
      <div className="space-y-4">
        <div>
          <Label required>Nom</Label>
          <Input autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Fitness club" />
        </div>
        <div>
          <Label>Tavsif</Label>
          <Input value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Qisqacha izoh" />
        </div>
        <div>
          <Label>Ikonka</Label>
          <div className="grid grid-cols-7 gap-2">
            {Object.entries(ICONS).map(([key, Ic]) => (
              <button
                key={key}
                onClick={() => setForm({ ...form, icon: key })}
                className={`aspect-square rounded-xl border flex items-center justify-center transition-all ${form.icon === key ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
              >
                <Ic size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
