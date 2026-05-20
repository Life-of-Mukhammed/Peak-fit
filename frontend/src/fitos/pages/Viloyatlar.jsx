import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Map, MapPin, Plus, Trash2, Pencil, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, Btn, IconBtn, Input, Label, Modal, Empty, Stat, AddBtn } from '../ui';

export default function Viloyatlar() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState({}); // id -> bool
  const [regionModal, setRegionModal] = useState(null);   // {name?} or null
  const [districtModal, setDistrictModal] = useState(null); // {regionId, dId?, name?} or null
  const [editingRegion, setEditingRegion] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setRegions((await api.get('/fitos/regions')).data); }
    catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const totalDistricts = regions.reduce((a, r) => a + (r.districts?.length || 0), 0);

  const saveRegion = async (name) => {
    try {
      if (editingRegion) await api.put(`/fitos/regions/${editingRegion._id}`, { name });
      else await api.post('/fitos/regions', { name });
      toast.success(editingRegion ? 'Yangilandi' : 'Qo‘shildi');
      setRegionModal(null); setEditingRegion(null);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
  };

  const removeRegion = async (id) => {
    if (!confirm('Viloyatni o‘chirasizmi? Tumanlari ham o‘chadi.')) return;
    await api.delete(`/fitos/regions/${id}`);
    toast.success('O‘chirildi');
    load();
  };

  const saveDistrict = async ({ regionId, dId, name }) => {
    try {
      if (dId) await api.put(`/fitos/regions/${regionId}/districts/${dId}`, { name });
      else await api.post(`/fitos/regions/${regionId}/districts`, { name });
      toast.success(dId ? 'Yangilandi' : 'Qo‘shildi');
      setDistrictModal(null);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
  };

  const removeDistrict = async (regionId, dId) => {
    if (!confirm('Tuman/shahar o‘chirilsinmi?')) return;
    await api.delete(`/fitos/regions/${regionId}/districts/${dId}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Viloyatlar" value={regions.length} icon={Map} accent="emerald" />
        <Stat label="Tuman/shahar" value={totalDistricts} icon={MapPin} accent="blue" />
        <Stat label="O‘rtacha" value={regions.length ? Math.round(totalDistricts / regions.length) : 0} sub="bir viloyatga" icon={MapPin} accent="amber" />
      </div>

      <div className="flex items-center justify-end">
        <AddBtn onClick={() => { setEditingRegion(null); setRegionModal({ name: '' }); }} label="Viloyat qo‘shish" />
      </div>

      {loading ? (
        <Card className="p-12 text-center text-slate-400">Yuklanmoqda...</Card>
      ) : regions.length === 0 ? (
        <Empty
          icon={Map}
          title="Hali viloyat qo‘shilmagan"
          sub="Birinchi viloyatni qo‘shing va keyin tuman/shahar qo‘shing"
          action={<AddBtn onClick={() => setRegionModal({ name: '' })} label="Viloyat qo‘shish" />}
        />
      ) : (
        <div className="space-y-3">
          {regions.map(r => {
            const expanded = open[r._id];
            return (
              <Card key={r._id} className="overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                  <button
                    onClick={() => setOpen(o => ({ ...o, [r._id]: !o[r._id] }))}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Map size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.districts?.length || 0} ta tuman/shahar</div>
                  </div>
                  <Btn variant="soft" icon={Plus} onClick={() => setDistrictModal({ regionId: r._id, name: '' })}>Tuman</Btn>
                  <IconBtn icon={Pencil} color="blue" onClick={() => { setEditingRegion(r); setRegionModal({ name: r.name }); }} />
                  <IconBtn icon={Trash2} color="rose" onClick={() => removeRegion(r._id)} />
                </div>
                {expanded && (
                  <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-3">
                    {r.districts.length === 0 ? (
                      <div className="text-sm text-slate-400 italic py-4 text-center">Tuman/shahar qo‘shilmagan</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {r.districts.map(d => (
                          <div key={d._id} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                            <MapPin size={14} className="text-slate-400" />
                            <div className="flex-1 text-sm text-slate-700 truncate">{d.name}</div>
                            <IconBtn icon={Pencil} color="blue" onClick={() => setDistrictModal({ regionId: r._id, dId: d._id, name: d.name })} />
                            <IconBtn icon={Trash2} color="rose" onClick={() => removeDistrict(r._id, d._id)} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {regionModal && (
        <RegionModal
          initial={regionModal.name}
          editing={!!editingRegion}
          onClose={() => { setRegionModal(null); setEditingRegion(null); }}
          onSave={saveRegion}
        />
      )}
      {districtModal && (
        <DistrictModal
          initial={districtModal.name}
          editing={!!districtModal.dId}
          onClose={() => setDistrictModal(null)}
          onSave={(name) => saveDistrict({ ...districtModal, name })}
        />
      )}
    </div>
  );
}

function RegionModal({ initial, editing, onClose, onSave }) {
  const [name, setName] = useState(initial || '');
  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'Viloyat tahrirlash' : 'Yangi viloyat'}
      subtitle="Viloyat nomini kiriting (masalan: Sirdaryo, Toshkent)"
      size="sm"
      footer={<>
        <Btn variant="outline" onClick={onClose}>Bekor</Btn>
        <Btn onClick={() => name.trim() && onSave(name.trim())}>Saqlash</Btn>
      </>}
    >
      <div>
        <Label required>Viloyat nomi</Label>
        <Input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Masalan: Sirdaryo" />
      </div>
    </Modal>
  );
}

function DistrictModal({ initial, editing, onClose, onSave }) {
  const [name, setName] = useState(initial || '');
  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'Tuman/shahar tahrirlash' : 'Yangi tuman/shahar'}
      subtitle="Yuqorida tanlangan viloyatga biriktiriladi"
      size="sm"
      footer={<>
        <Btn variant="outline" onClick={onClose}>Bekor</Btn>
        <Btn onClick={() => name.trim() && onSave(name.trim())}>Saqlash</Btn>
      </>}
    >
      <div>
        <Label required>Tuman/shahar nomi</Label>
        <Input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Masalan: Boyovut tumani" />
      </div>
    </Modal>
  );
}
