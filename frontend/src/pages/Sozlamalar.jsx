import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Save, Upload } from 'lucide-react';
import api from '../utils/api';

export default function Sozlamalar() {
  const [settings, setSettings] = useState({ gymName: 'Peak Fit', phone: '', address: '', currency: 'UZS', workingHours: '' });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    api.get('/settings').then(res => {
      setSettings(res.data);
      if (res.data.logo) setLogoPreview(res.data.logo);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('data', JSON.stringify(settings));
      if (logo) fd.append('logo', logo);
      await api.put('/settings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Sozlamalar saqlandi');
    } catch { toast.error('Xato'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sozlamalar</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Zal ma'lumotlari</h2>

          <div className="flex items-start gap-4 mb-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 cursor-pointer hover:border-accent flex items-center justify-center overflow-hidden flex-shrink-0"
            >
              {logoPreview
                ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                : <Upload size={24} className="text-gray-400" />
              }
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-700 mb-1">Zal logotipi</div>
              <button type="button" onClick={() => fileRef.current?.click()} className="text-sm text-accent hover:underline">
                Rasm yuklash
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const f = e.target.files[0]; setLogo(f); setLogoPreview(URL.createObjectURL(f));
            }} />
          </div>

          <div className="space-y-3">
            {[
              { key: 'gymName', label: 'Zal nomi', placeholder: 'Peak Fit' },
              { key: 'phone', label: 'Telefon raqam', placeholder: '+998 90 000 00 00' },
              { key: 'address', label: 'Manzil', placeholder: 'Toshkent, ...' },
              { key: 'workingHours', label: 'Ish vaqti', placeholder: '06:00 - 22:00' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  value={settings[field.key] || ''}
                  onChange={e => setSettings({...settings, [field.key]: e.target.value})}
                  placeholder={field.placeholder}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-accent"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valyuta</label>
              <select value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-accent">
                <option value="UZS">UZS - O'zbek so'mi</option>
                <option value="USD">USD - Dollar</option>
                <option value="EUR">EUR - Yevro</option>
              </select>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-accent flex items-center gap-2 w-full justify-center py-3">
          <Save size={18} /> {loading ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </form>
    </div>
  );
}
