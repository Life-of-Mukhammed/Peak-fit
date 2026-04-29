import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, Tag, Clock, Calendar, CheckCircle2, X,
  Wrench, Layers, Sparkles, ChevronRight,
} from 'lucide-react';
import api from '../utils/api';
import { formatMoney } from '../utils/format';
import Modal from '../components/Modal';
import { useTariffs } from '../context/TariffsContext';

const INITIAL_FORM = { name: '', price: '', duration: '', validFrom: '', validTo: '' };

export default function Tariflar() {
  const { refresh: refreshGlobalTariffs } = useTariffs();
  const [tariffs, setTariffs] = useState([]);
  const [services, setServices] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [features, setFeatures] = useState([]);
  const [featureInput, setFeatureInput] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);   // ids
  const [loading, setLoading] = useState(false);
  const featureRef = useRef();

  // Services modal
  const [showServices, setShowServices] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({ name: '', description: '' });
  const [serviceLoading, setServiceLoading] = useState(false);

  useEffect(() => {
    fetchTariffs();
    fetchServices();
  }, []);

  const fetchTariffs = async () => {
    try { const res = await api.get('/tariffs'); setTariffs(res.data); }
    catch { toast.error('Tariflarni yuklashda xato'); }
  };

  const fetchServices = async () => {
    try { const res = await api.get('/services'); setServices(res.data); }
    catch { /* silent */ }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(INITIAL_FORM);
    setFeatures([]);
    setFeatureInput('');
    setSelectedServices([]);
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.name,
      price: t.price,
      duration: t.duration,
      validFrom: t.validFrom || (t.validHours ? t.validHours.split('-')[0]?.trim() : ''),
      validTo: t.validTo || (t.validHours ? t.validHours.split('-')[1]?.trim() : ''),
    });
    setFeatures(t.features || []);
    setSelectedServices((t.services || []).map(s => s._id || s));
    setFeatureInput('');
    setShowModal(true);
  };

  const handleFeatureKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = featureInput.trim();
      if (val && !features.includes(val)) setFeatures(prev => [...prev, val]);
      setFeatureInput('');
    }
  };

  const removeFeature = (idx) => setFeatures(prev => prev.filter((_, i) => i !== idx));

  const toggleService = (id) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...form,
        price: Number(form.price),
        duration: Number(form.duration),
        features,
        services: selectedServices,
        validHours: form.validFrom && form.validTo ? `${form.validFrom} - ${form.validTo}` : '',
      };
      if (editing) {
        await api.put(`/tariffs/${editing._id}`, data);
        toast.success('Tarif yangilandi');
      } else {
        await api.post('/tariffs', data);
        toast.success('Tarif qo\'shildi');
      }
      setShowModal(false);
      fetchTariffs();
      refreshGlobalTariffs();
    } catch (err) { toast.error(err.response?.data?.message || 'Xato'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tarifni o\'chirishni tasdiqlaysizmi?')) return;
    try {
      await api.delete(`/tariffs/${id}`);
      toast.success('O\'chirildi');
      fetchTariffs();
      refreshGlobalTariffs();
    } catch { toast.error('Xato'); }
  };

  // ---- Services management ----
  const openServices = () => {
    setShowServices(true);
    setEditingService(null);
    setServiceForm({ name: '', description: '' });
  };

  const submitService = async (e) => {
    e.preventDefault();
    if (!serviceForm.name.trim()) { toast.error('Hizmat nomini kiriting'); return; }
    setServiceLoading(true);
    try {
      if (editingService) {
        await api.put(`/services/${editingService._id}`, serviceForm);
        toast.success('Hizmat yangilandi');
      } else {
        await api.post('/services', serviceForm);
        toast.success('Hizmat qo\'shildi');
      }
      setEditingService(null);
      setServiceForm({ name: '', description: '' });
      fetchServices();
    } catch (err) { toast.error(err.response?.data?.message || 'Xato'); }
    finally { setServiceLoading(false); }
  };

  const editService = (s) => {
    setEditingService(s);
    setServiceForm({ name: s.name, description: s.description || '' });
  };

  const deleteService = async (id) => {
    if (!confirm('Hizmatni o\'chirishni tasdiqlaysizmi?')) return;
    try {
      await api.delete(`/services/${id}`);
      toast.success('O\'chirildi');
      fetchServices();
    } catch { toast.error('Xato'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tariflar</h1>
          <p className="text-slate-500 text-sm mt-0.5">{tariffs.length} ta tarif · {services.length} ta hizmat</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openServices}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <Wrench size={16} /> Hizmat qo'shish
            {services.length > 0 && (
              <span className="ml-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">{services.length}</span>
            )}
          </button>
          <button onClick={openCreate} className="btn-accent flex items-center gap-2">
            <Plus size={18} /> Tarif yaratish
          </button>
        </div>
      </div>

      {/* No-services hint */}
      {services.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-900 text-sm">Birinchi hizmatlarni qo'shing</div>
            <div className="text-slate-600 text-sm">Tarif yaratishdan oldin zal hizmatlarini (Trenajor zali, Yoga, Sauna...) qo'shing — ular tariflar tarkibiga checkbox orqali belgilanadi.</div>
          </div>
          <button onClick={openServices} className="text-amber-700 font-semibold text-sm flex items-center gap-1 whitespace-nowrap hover:underline">
            Hizmat qo'shish <ChevronRight size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tariffs.map(t => (
          <div key={t._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-br from-sidebar to-sidebar-hover p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                  <Tag size={20} className="text-white" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)} className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(t._id)} className="p-1.5 bg-white/10 hover:bg-red-500/50 text-white rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="text-white font-bold text-lg">{t.name}</h3>
              <div className="text-accent font-bold text-2xl mt-1">{formatMoney(t.price)}</div>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar size={15} className="text-slate-400" />
                <span>{t.duration} kun</span>
              </div>
              {(t.validFrom || t.validTo || t.validHours) && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock size={15} className="text-slate-400" />
                  <span>
                    {t.validFrom && t.validTo
                      ? `${t.validFrom} – ${t.validTo}`
                      : t.validHours}
                  </span>
                </div>
              )}
              {t.services?.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1.5 font-semibold">Hizmatlar</div>
                  <div className="flex flex-wrap gap-1">
                    {t.services.map((s) => (
                      <span key={s._id || s} className="text-xs bg-accent/10 text-accent-dark px-2 py-0.5 rounded-md font-medium">
                        {s.name || s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {t.features?.length > 0 && (
                <div className="pt-2 space-y-1">
                  {t.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 size={14} className="text-accent flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {tariffs.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            <Tag size={48} className="mx-auto mb-3 opacity-30" />
            <p>Tariflar yo'q. Yangi tarif yarating.</p>
          </div>
        )}
      </div>

      {/* Tarif modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Tarif tahrirlash' : 'Yangi tarif yaratish'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tarif nomi *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
                className="input" placeholder="Misol: Oylik Standard" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tarif narxi *</label>
              <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required
                className="input" placeholder="0 UZS" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kun davomiyligi *</label>
              <input type="number" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} required
                className="input" placeholder="30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kelish vaqti</label>
              <input type="time" value={form.validFrom} onChange={e => setForm({...form, validFrom: e.target.value})} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ketish vaqti</label>
              <input type="time" value={form.validTo} onChange={e => setForm({...form, validTo: e.target.value})} className="input" />
            </div>
          </div>

          {/* Services checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                <Layers size={14} className="inline mr-1.5 -mt-0.5" />
                Hizmatlar
                <span className="text-slate-400 font-normal ml-1">({selectedServices.length} tanlangan)</span>
              </label>
              <button type="button" onClick={() => { setShowModal(false); openServices(); }} className="text-xs text-accent hover:underline">
                + Hizmat qo'shish
              </button>
            </div>
            {services.length === 0 ? (
              <div className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 text-center">
                Avval hizmat qo'shing — yuqoridagi tugmadan
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {services.map(s => {
                  const checked = selectedServices.includes(s._id);
                  return (
                    <label
                      key={s._id}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors text-sm
                        ${checked ? 'border-accent bg-accent/5' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleService(s._id)}
                        className="w-4 h-4 accent-accent"
                      />
                      <span className="flex-1 truncate">{s.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom features (free-text) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Qo'shimcha imkoniyatlar
              <span className="text-slate-400 font-normal ml-1">(Enter bilan qo'shing)</span>
            </label>
            {features.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {features.map((f, i) => (
                  <span key={i} className="flex items-center gap-1.5 bg-accent/15 text-accent-dark text-sm px-3 py-1 rounded-full border border-accent/30">
                    {f}
                    <button type="button" onClick={() => removeFeature(i)} className="hover:text-rose-500 transition-colors">
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              ref={featureRef}
              value={featureInput}
              onChange={e => setFeatureInput(e.target.value)}
              onKeyDown={handleFeatureKey}
              placeholder="Erkin matn (masalan: Ichki to'xtash joyi)"
              className="input"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-lg hover:bg-slate-50">Bekor qilish</button>
            <button type="submit" disabled={loading} className="flex-1 bg-accent hover:bg-accent-dark text-white font-semibold py-2.5 rounded-lg disabled:opacity-50">
              {loading ? 'Saqlanmoqda...' : (editing ? 'Saqlash' : 'Yaratish')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Services management modal */}
      <Modal isOpen={showServices} onClose={() => setShowServices(false)} title="Hizmatlar boshqaruvi" size="md">
        <div className="space-y-5">
          <form onSubmit={submitService} className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <Wrench size={15} className="text-accent" />
              {editingService ? 'Hizmatni tahrirlash' : 'Yangi hizmat'}
            </div>
            <div className="grid grid-cols-1 gap-3">
              <input
                value={serviceForm.name}
                onChange={e => setServiceForm({...serviceForm, name: e.target.value})}
                placeholder="Hizmat nomi (Trenajor zali, Yoga, Sauna, Kardio zona...)"
                className="input"
                required
              />
              <input
                value={serviceForm.description}
                onChange={e => setServiceForm({...serviceForm, description: e.target.value})}
                placeholder="Tavsif (ixtiyoriy)"
                className="input"
              />
            </div>
            <div className="flex gap-2 justify-end">
              {editingService && (
                <button type="button" onClick={() => { setEditingService(null); setServiceForm({ name: '', description: '' }); }} className="text-sm text-slate-500 px-3 py-2 hover:text-slate-800">
                  Bekor qilish
                </button>
              )}
              <button type="submit" disabled={serviceLoading} className="btn-accent flex items-center gap-2 text-sm">
                <Plus size={15} />
                {serviceLoading ? 'Saqlanmoqda...' : (editingService ? 'Saqlash' : 'Qo\'shish')}
              </button>
            </div>
          </form>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">Mavjud hizmatlar ({services.length})</div>
            {services.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                <Wrench size={32} className="mx-auto mb-2 opacity-30" />
                Hozircha hizmatlar yo'q
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {services.map(s => (
                  <div key={s._id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Wrench size={15} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm truncate">{s.name}</div>
                      {s.description && <div className="text-xs text-slate-400 truncate">{s.description}</div>}
                    </div>
                    <button onClick={() => editService(s)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg"><Edit2 size={14} /></button>
                    <button onClick={() => deleteService(s._id)} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
