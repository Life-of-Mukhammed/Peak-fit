import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, MapPin, Phone, Star, Building2,
  BarChart2, TrendingUp, Users, Shield, ChevronDown, ChevronUp
} from 'lucide-react';
import { useBranch } from '../context/BranchContext';
import api from '../utils/api';
import { formatMoney } from '../utils/format';
import Modal from '../components/Modal';

const INITIAL_FORM = { name: '', address: '', phone: '', isMain: false, isActive: true };

export default function Filiallar() {
  const { branches, fetchBranches, selectBranch, selected } = useBranch();
  const [showModal, setShowModal]     = useState(false);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(INITIAL_FORM);
  const [loading, setLoading]         = useState(false);
  const [showReport, setShowReport]   = useState(false);
  const [reportData, setReportData]   = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  const openCreate = () => { setEditing(null); setForm(INITIAL_FORM); setShowModal(true); };
  const openEdit   = (b) => {
    setEditing(b);
    setForm({ name: b.name, address: b.address || '', phone: b.phone || '', isMain: b.isMain, isActive: b.isActive });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/branches/${editing._id}`, form);
        toast.success('Filial yangilandi');
      } else {
        await api.post('/branches', form);
        toast.success('Filial qo\'shildi');
      }
      setShowModal(false);
      fetchBranches();
    } catch (err) { toast.error(err.response?.data?.message || 'Xato'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Filialni o\'chirishni tasdiqlaysizmi?')) return;
    try {
      await api.delete(`/branches/${id}`);
      toast.success('Filial o\'chirildi');
      fetchBranches();
    } catch (err) { toast.error(err.response?.data?.message || 'Xato'); }
  };

  const handleSetMain = async (b) => {
    try {
      await api.put(`/branches/${b._id}`, { ...b, isMain: true });
      toast.success(`"${b.name}" asosiy filial qilindi`);
      fetchBranches();
    } catch { toast.error('Xato'); }
  };

  const toggleReport = async () => {
    if (showReport) { setShowReport(false); return; }
    setShowReport(true);
    setReportLoading(true);
    try {
      const res = await api.get('/reports/by-branch');
      setReportData(res.data);
    } catch { toast.error('Hisobot yuklashda xato'); }
    finally { setReportLoading(false); }
  };

  // Totals across all branches
  const totals = reportData.reduce((acc, b) => ({
    todayTotal:  acc.todayTotal  + b.todayTotal,
    monthlyTotal: acc.monthlyTotal + b.monthlyTotal,
    activeSubscriptions: acc.activeSubscriptions + b.activeSubscriptions,
    totalDebt:   acc.totalDebt   + b.totalDebt,
    totalCustomers: acc.totalCustomers + b.totalCustomers,
  }), { todayTotal: 0, monthlyTotal: 0, activeSubscriptions: 0, totalDebt: 0, totalCustomers: 0 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Filiallar</h1>
          <p className="text-gray-500 text-sm mt-0.5">{branches.length} ta filial</p>
        </div>
        <button onClick={openCreate} className="btn-accent flex items-center gap-2">
          <Plus size={18} /> Filial qo'shish
        </button>
      </div>

      {/* Branch cards */}
      {branches.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Building2 size={52} className="mx-auto mb-3 opacity-25" />
          <p className="text-base font-medium">Filiallar mavjud emas</p>
          <p className="text-sm mt-1">Birinchi filialni qo'shing</p>
          <button onClick={openCreate} className="btn-accent mt-4 inline-flex items-center gap-2">
            <Plus size={16} /> Filial qo'shish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {branches.map(b => (
            <div
              key={b._id}
              onClick={() => selectBranch(b)}
              className={`bg-white rounded-2xl border-2 shadow-sm cursor-pointer transition-all hover:shadow-md
                ${selected?._id === b._id ? 'border-accent' : 'border-gray-100 hover:border-gray-200'}`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                    ${b.isMain ? 'bg-accent' : 'bg-sidebar/10'}`}>
                    <Building2 size={22} className={b.isMain ? 'text-white' : 'text-slate-500'} />
                  </div>
                  <div className="flex items-center gap-1">
                    {b.isMain && (
                      <span className="flex items-center gap-1 text-xs bg-accent/15 text-accent-dark font-semibold px-2 py-1 rounded-full">
                        <Star size={11} fill="currentColor" /> Asosiy
                      </span>
                    )}
                    {selected?._id === b._id && (
                      <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">
                        Tanlangan
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight">{b.name}</h3>
                <div className="mt-3 space-y-1.5">
                  {b.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-500">
                      <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="leading-snug">{b.address}</span>
                    </div>
                  )}
                  {b.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{b.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                  ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {b.isActive ? 'Faol' : 'Nofaol'}
                </span>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  {!b.isMain && (
                    <button onClick={() => handleSetMain(b)} className="p-1.5 hover:bg-yellow-50 text-yellow-500 rounded-lg" title="Asosiy qilish">
                      <Star size={14} />
                    </button>
                  )}
                  <button onClick={() => openEdit(b)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(b._id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All-branches report toggle button */}
      {branches.length > 0 && (
        <div>
          <button
            onClick={toggleReport}
            className={`flex items-center gap-3 w-full px-6 py-4 rounded-2xl border-2 border-dashed font-semibold transition-all
              ${showReport
                ? 'border-accent bg-accent/5 text-slate-900'
                : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}
          >
            <BarChart2 size={20} />
            <span className="flex-1 text-left">Hamma filiallar hisobotini ko'rish</span>
            {showReport ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showReport && (
            <div className="mt-4 space-y-4">
              {reportLoading ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Yuklanmoqda...
                </div>
              ) : (
                <>
                  {/* Summary totals */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Jami bugungi tushum', value: formatMoney(totals.todayTotal), color: 'text-green-700', bg: 'bg-green-50 border-green-100', icon: <TrendingUp size={16} className="text-green-600" /> },
                      { label: 'Jami oylik tushum',   value: formatMoney(totals.monthlyTotal), color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100', icon: <TrendingUp size={16} className="text-blue-600" /> },
                      { label: 'Faol obunalar',        value: `${totals.activeSubscriptions} ta`, color: 'text-accent-dark', bg: 'bg-yellow-50 border-yellow-100', icon: <Shield size={16} className="text-yellow-600" /> },
                      { label: 'Umumiy qarz',          value: formatMoney(totals.totalDebt), color: 'text-red-600', bg: 'bg-red-50 border-red-100', icon: <Users size={16} className="text-red-500" /> },
                    ].map(c => (
                      <div key={c.label} className={`rounded-xl border p-4 ${c.bg}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {c.icon}
                          <span className="text-xs text-gray-500">{c.label}</span>
                        </div>
                        <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Per-branch table */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                      <BarChart2 size={18} className="text-gray-400" />
                      <span className="font-semibold text-gray-800">Filiallar bo'yicha batafsil</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Filial</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Bugungi tushum</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Oylik tushum</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Faol obunalar</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Mijozlar</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Qarz</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((b, i) => (
                            <tr
                              key={b._id}
                              className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer
                                ${selected?._id === b._id ? 'bg-accent/5' : ''}`}
                              onClick={() => { selectBranch(branches.find(br => br._id === b._id)); }}
                            >
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                                    ${b.isMain ? 'bg-accent' : 'bg-gray-100'}`}>
                                    <Building2 size={14} className={b.isMain ? 'text-white' : 'text-gray-500'} />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900 text-sm flex items-center gap-1">
                                      {b.name}
                                      {b.isMain && <Star size={11} className="text-accent" fill="currentColor" />}
                                    </div>
                                    {b.address && <div className="text-xs text-gray-400">{b.address}</div>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-green-600 text-sm">
                                {formatMoney(b.todayTotal)}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-blue-600 text-sm">
                                {formatMoney(b.monthlyTotal)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-sm font-semibold text-gray-700">{b.activeSubscriptions}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-sm text-gray-600">{b.totalCustomers}</span>
                              </td>
                              <td className="px-5 py-3 text-right">
                                {b.totalDebt > 0
                                  ? <span className="text-sm font-semibold text-red-500">{formatMoney(b.totalDebt)}</span>
                                  : <span className="text-sm text-gray-400">—</span>
                                }
                              </td>
                            </tr>
                          ))}
                          {/* Totals row */}
                          <tr className="bg-gray-50 border-t-2 border-gray-200">
                            <td className="px-5 py-3 font-bold text-gray-800 text-sm">Jami</td>
                            <td className="px-4 py-3 text-right font-bold text-green-700 text-sm">{formatMoney(totals.todayTotal)}</td>
                            <td className="px-4 py-3 text-right font-bold text-blue-700 text-sm">{formatMoney(totals.monthlyTotal)}</td>
                            <td className="px-4 py-3 text-center font-bold text-gray-800 text-sm">{totals.activeSubscriptions}</td>
                            <td className="px-4 py-3 text-center font-bold text-gray-800 text-sm">{totals.totalCustomers}</td>
                            <td className="px-5 py-3 text-right font-bold text-red-600 text-sm">{formatMoney(totals.totalDebt)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Filialni tahrirlash' : 'Yangi filial qo\'shish'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filial nomi *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
              placeholder="Masalan: Chilonzor filiali"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-accent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manzil</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="Ko'cha, uy raqami..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-accent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+998 90 000 00 00"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-accent" />
          </div>
          <div className="flex gap-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isMain} onChange={e => setForm({ ...form, isMain: e.target.checked })} className="w-4 h-4 accent-sidebar rounded" />
              <span className="text-sm text-gray-700">Asosiy filial</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-sidebar rounded" />
              <span className="text-sm text-gray-700">Faol</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg hover:bg-gray-50">
              Bekor qilish
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-accent text-white font-semibold py-2.5 rounded-lg hover:bg-accent-dark disabled:opacity-50">
              {loading ? 'Saqlanmoqda...' : (editing ? 'Saqlash' : 'Qo\'shish')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
