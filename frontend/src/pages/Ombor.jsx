import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import { formatMoney } from '../utils/format';
import Modal from '../components/Modal';

const INITIAL_FORM = { name: '', quantity: '', purchasePrice: '', salePrice: '', barcode: '', type: '' };

export default function Ombor() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try { const res = await api.get('/products'); setProducts(res.data); }
    catch { toast.error('Xato'); }
  };

  const filtered = products.filter(p =>
    `${p.name} ${p.barcode} ${p.type}`.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm(INITIAL_FORM); setImage(null); setImagePreview(''); setShowModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, quantity: p.quantity, purchasePrice: p.purchasePrice, salePrice: p.salePrice, barcode: p.barcode || '', type: p.type || '' });
    setImagePreview(p.image || '');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('data', JSON.stringify(form));
      if (image) fd.append('image', image);
      if (editing) {
        await api.put(`/products/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Mahsulot yangilandi');
      } else {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Mahsulot qo\'shildi');
      }
      setShowModal(false); fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Xato'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Mahsulotni o\'chirishni tasdiqlaysizmi?')) return;
    try { await api.delete(`/products/${id}`); toast.success('O\'chirildi'); fetchProducts(); }
    catch { toast.error('Xato'); }
  };

  const totalValue = products.reduce((s, p) => s + p.salePrice * p.quantity, 0);
  const lowStock = products.filter(p => p.quantity <= 5).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ombor</h1>
          <p className="text-gray-500 text-sm mt-0.5">{products.length} ta mahsulot</p>
        </div>
        <button onClick={openCreate} className="btn-accent flex items-center gap-2">
          <Plus size={18} /> Mahsulot qo'shish
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm mb-1">Mahsulotlar soni</div>
          <div className="text-2xl font-bold text-gray-900">{products.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm mb-1">Ombor qiymati</div>
          <div className="text-2xl font-bold text-accent">{formatMoney(totalValue)}</div>
        </div>
        <div className={`bg-white rounded-xl p-4 shadow-sm border ${lowStock > 0 ? 'border-red-200' : 'border-gray-100'}`}>
          <div className="text-gray-500 text-sm mb-1">Kam qoldiq</div>
          <div className={`text-2xl font-bold ${lowStock > 0 ? 'text-red-500' : 'text-gray-900'}`}>{lowStock} ta</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Mahsulot nomi yoki barkod..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-accent" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Mahsulot</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Turi</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Barkod</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Kelish narxi</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sotish narxi</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Qoldiq</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p._id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${p.quantity <= 5 ? 'bg-red-50/50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <Package size={18} className="text-gray-400" />}
                      </div>
                      <span className="font-medium text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.type || '-'}</td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-500">{p.barcode || '-'}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">{formatMoney(p.purchasePrice)}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-accent">{formatMoney(p.salePrice)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${p.quantity <= 5 ? 'text-red-500' : 'text-gray-700'}`}>
                      {p.quantity <= 5 && <AlertTriangle size={12} />}
                      {p.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(p._id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Mahsulot topilmadi</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center mb-2">
            <div onClick={() => fileRef.current?.click()} className="w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 cursor-pointer hover:border-accent flex items-center justify-center overflow-hidden">
              {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> : <Package size={28} className="text-gray-400" />}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files[0]; setImage(f); setImagePreview(URL.createObjectURL(f)); }} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Mahsulot nomi *', required: true, placeholder: 'Protein shake' },
              { key: 'type', label: 'Mahsulot turi', placeholder: 'Vitamin, Sport...' },
              { key: 'barcode', label: 'Barkod', placeholder: '1234567890' },
              { key: 'quantity', label: 'Soni *', required: true, type: 'number', placeholder: '0' },
              { key: 'purchasePrice', label: 'Kelish narxi *', required: true, type: 'number', placeholder: '0' },
              { key: 'salePrice', label: 'Sotish narxi *', required: true, type: 'number', placeholder: '0' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  type={field.type || 'text'}
                  value={form[field.key]}
                  onChange={e => setForm({...form, [field.key]: e.target.value})}
                  required={field.required}
                  placeholder={field.placeholder}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-accent"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg hover:bg-gray-50">Bekor qilish</button>
            <button type="submit" disabled={loading} className="flex-1 bg-accent text-white font-semibold py-2.5 rounded-lg hover:bg-accent-dark disabled:opacity-50">
              {loading ? 'Saqlanmoqda...' : (editing ? 'Saqlash' : 'Qo\'shish')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
