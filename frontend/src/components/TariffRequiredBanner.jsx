import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, ArrowRight, Sparkles } from 'lucide-react';

export default function TariffRequiredBanner() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-10 max-w-lg text-center">
        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-50 mb-6">
          <Tag size={42} className="text-amber-500" strokeWidth={1.6} />
          <span className="absolute -top-1 -right-1 w-9 h-9 rounded-full bg-accent flex items-center justify-center shadow-md ring-4 ring-white">
            <Sparkles size={16} className="text-white" />
          </span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Avval tarif qo'shing
        </h2>
        <p className="text-slate-500 leading-relaxed mb-6">
          Tizimdan to'liq foydalanish uchun, avval kamida bitta tarif yarating. Tariflar — mijozlaringizga sotadigan obuna paketlaringiz (oylik, yillik, VIP va h.k.).
        </p>
        <button
          onClick={() => navigate('/tariflar')}
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-md shadow-accent/20"
        >
          Tarif yaratish <ArrowRight size={16} />
        </button>
        <p className="text-xs text-slate-400 mt-4">Maslahat: avval "Hizmat qo'shish" orqali zal imkoniyatlarini kiriting</p>
      </div>
    </div>
  );
}
