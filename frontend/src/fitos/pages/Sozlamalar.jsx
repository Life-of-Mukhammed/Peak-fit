import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Settings, Database, ShieldAlert, Sparkles, Map, Layers, Tag, Building2, Wallet, Users2, MessageSquare } from 'lucide-react';
import { Card, Btn, Stat } from '../ui';

export default function Sozlamalar() {
  const [counts, setCounts] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    try {
      const [r, s, t, c, p, m, d] = await Promise.all([
        api.get('/fitos/regions'), api.get('/fitos/services'), api.get('/fitos/tariffs'),
        api.get('/fitos/clubs/stats'), api.get('/fitos/payments/stats'),
        api.get('/fitos/messages/stats'), api.get('/fitos/dealers'),
      ]);
      setCounts({
        regions: r.data.length,
        districts: r.data.reduce((a, x) => a + (x.districts?.length || 0), 0),
        services: s.data.length,
        tariffs: t.data.length,
        clubs: c.data?.total || 0,
        payments: p.data?.byPeriod?.reduce((a, x) => a + x.count, 0) || 0,
        messages: m.data?.total || 0,
        dealers: d.data.length,
      });
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const seedDemo = async () => {
    if (!confirm('Demo ma\'lumotlar bilan to‘ldirilsinmi? Mavjud yozuvlar saqlanadi.')) return;
    setSeeding(true);
    try {
      // Regions
      const regs = ['Sirdaryo', 'Toshkent', 'Samarqand'];
      const regResults = [];
      for (const name of regs) {
        try { regResults.push((await api.post('/fitos/regions', { name })).data); } catch {}
      }
      const all = (await api.get('/fitos/regions')).data;
      const sirdaryo = all.find(r => r.name === 'Sirdaryo');
      if (sirdaryo) {
        for (const d of ['Boyovut tumani', 'Guliston shahar', 'Sayxunobod tumani']) {
          try { await api.post(`/fitos/regions/${sirdaryo._id}/districts`, { name: d }); } catch {}
        }
      }
      // Services
      for (const s of [
        { name: 'Fitness club', icon: 'dumbbell', description: 'Sportzal va fitness markazlari' },
        { name: 'Game club', icon: 'gamepad', description: 'PlayStation va kompyuter klublari' },
      ]) { try { await api.post('/fitos/services', s); } catch {} }
      // Tariffs
      try {
        await api.post('/fitos/tariffs', {
          name: 'Start', price: 200000, color: '#3b82f6', sort: 1,
          description: 'Boshlang‘ich tarif',
          limits: { branches: 1, employees: 1, customers: 100, admins: 1 },
          features: { inventory: true, reports3Months: true, debt: true, camera: true, scanner: true, computerOnly: true, bar: true },
        });
      } catch {}
      try {
        await api.post('/fitos/tariffs', {
          name: 'Premium', price: 500000, color: '#22c55e', sort: 2,
          description: 'Start imkoniyatlari + yana ko‘p',
          limits: { branches: 2, employees: 5, customers: 1000, admins: 4 },
          features: { inventory: true, reports3Months: true, reportsUnlimited: true, debt: true, camera: true, scanner: true, computerOnly: true, bar: true, sms: true, telegram: true },
        });
      } catch {}
      toast.success('Demo ma\'lumotlar yuklandi');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
    finally { setSeeding(false); }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900 text-white border-0 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">
              <Sparkles size={14} /> KiGo Platform
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Tizim sozlamalari</h2>
            <p className="text-slate-300 text-sm mt-1.5 max-w-xl">
              Bu yerdan barcha hududlar, xizmatlar, tariflar va dillerlarning umumiy holatini ko‘rishingiz va demo ma'lumotlarni yuklashingiz mumkin.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Viloyatlar" value={counts?.regions ?? '—'} icon={Map} accent="emerald" sub={`${counts?.districts ?? 0} tuman/shahar`} />
        <Stat label="Xizmatlar" value={counts?.services ?? '—'} icon={Layers} accent="blue" />
        <Stat label="Tariflar" value={counts?.tariffs ?? '—'} icon={Tag} accent="amber" />
        <Stat label="Klublar" value={counts?.clubs ?? '—'} icon={Building2} accent="emerald" />
        <Stat label="To‘lovlar" value={counts?.payments ?? '—'} icon={Wallet} accent="blue" />
        <Stat label="Xabarlar" value={counts?.messages ?? '—'} icon={MessageSquare} accent="amber" />
        <Stat label="Dillerlar" value={counts?.dealers ?? '—'} icon={Users2} accent="emerald" />
        <Stat label="DB" value="MongoDB" icon={Database} accent="slate" />
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={22} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-900">Demo ma'lumotlar</div>
            <div className="text-sm text-slate-500 mt-1 max-w-xl">
              Sirdaryo + tumanlari, Fitness/Game club xizmatlari, Start va Premium tariflari yuklanadi.
              Mavjud yozuvlar o‘chmaydi.
            </div>
            <div className="mt-4">
              <Btn onClick={seedDemo} disabled={seeding} icon={Sparkles}>
                {seeding ? 'Yuklanmoqda...' : 'Demo ma\'lumotlarni yuklash'}
              </Btn>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
            <Settings size={22} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-900">Versiya</div>
            <div className="text-sm text-slate-500 mt-1">KiGo Super Admin v1.0</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
