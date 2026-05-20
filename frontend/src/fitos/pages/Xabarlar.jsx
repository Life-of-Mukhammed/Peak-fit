import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MessageSquare, Send, Mail, MailOpen, MailCheck, Trash2, Search } from 'lucide-react';
import { Card, Btn, IconBtn, Input, Label, Modal, Empty, Stat, Badge, fmtUZ } from '../ui';

const FILTERS = [
  { key: 'all',     label: 'Hammasi' },
  { key: 'unread',  label: 'O‘qilmagan', tone: 'rose' },
  { key: 'read',    label: 'O‘qilgan',   tone: 'blue' },
  { key: 'replied', label: 'Javob berilgan', tone: 'emerald' },
];

export default function Xabarlar() {
  const [filter, setFilter] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null); // active message

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (from) params.from = from;
      if (to) params.to = to;
      const [list, st] = await Promise.all([
        api.get('/fitos/messages', { params }),
        api.get('/fitos/messages/stats'),
      ]);
      setItems(list.data); setStats(st.data);
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter, from, to]);

  const visible = search.trim()
    ? items.filter(m => (m.fromName + m.subject + m.body + (m.club?.name || '')).toLowerCase().includes(search.toLowerCase()))
    : items;

  const markRead = async (m) => {
    if (m.status === 'unread') {
      await api.post(`/fitos/messages/${m._id}/read`);
      load();
    }
    setOpen(m);
  };

  const reply = async (body) => {
    if (!open) return;
    try {
      await api.post(`/fitos/messages/${open._id}/reply`, { body, by: 'KiGo Platform' });
      toast.success('Javob yuborildi');
      setOpen(null); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Xatolik'); }
  };

  const remove = async (id) => {
    if (!confirm('Xabarni o‘chirasizmi?')) return;
    await api.delete(`/fitos/messages/${id}`);
    setOpen(null); load();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Jami xabarlar" value={stats?.total ?? 0} icon={MessageSquare} accent="emerald" />
        <Stat label="O‘qilmagan" value={stats?.unread ?? 0} icon={Mail} accent="rose" />
        <Stat label="O‘qilgan" value={stats?.read ?? 0} icon={MailOpen} accent="blue" />
        <Stat label="Javob berilgan" value={stats?.replied ?? 0} icon={MailCheck} accent="emerald" />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FILTERS.map(p => {
          const active = filter === p.key;
          return (
            <button key={p.key} onClick={() => setFilter(p.key)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border
                ${active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
              {p.label}
            </button>
          );
        })}
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..." className="pl-10" />
          </div>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} placeholder="Boshlanish" />
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} placeholder="Tugash" />
        </div>
      </Card>

      {loading ? (
        <Card className="p-12 text-center text-slate-400">Yuklanmoqda...</Card>
      ) : visible.length === 0 ? (
        <Empty icon={MessageSquare} title="Xabar yo‘q" sub="Mijozlardan kelgan xabarlar bu yerda ko‘rinadi" />
      ) : (
        <div className="space-y-2">
          {visible.map(m => {
            const tone = m.status === 'unread' ? 'rose' : m.status === 'replied' ? 'emerald' : 'blue';
            return (
              <Card key={m._id} className={`p-4 cursor-pointer hover:shadow-md transition-all ${m.status === 'unread' ? 'border-l-4 border-l-rose-500' : ''}`} onClick={() => markRead(m)}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${m.status === 'unread' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                    {(m.fromName || m.club?.name || '?')[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`text-sm truncate ${m.status === 'unread' ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {m.fromName || m.club?.name || '—'}
                      </div>
                      {m.club && <Badge tone="slate">{m.club.name}</Badge>}
                      <Badge tone={tone}>{FILTERS.find(f => f.key === m.status)?.label || m.status}</Badge>
                    </div>
                    {m.subject && <div className="text-sm text-slate-700 mt-0.5 truncate">{m.subject}</div>}
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{m.body}</div>
                  </div>
                  <div className="text-[11px] text-slate-400 flex-shrink-0">{fmtUZ(m.createdAt)}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {open && <MessageModal m={open} onClose={() => setOpen(null)} onReply={reply} onDelete={() => remove(open._id)} />}
    </div>
  );
}

function MessageModal({ m, onClose, onReply, onDelete }) {
  const [text, setText] = useState('');
  return (
    <Modal
      open onClose={onClose}
      title={m.subject || 'Xabar'}
      subtitle={`${m.fromName || m.club?.name || '—'} • ${fmtUZ(m.createdAt)}`}
      size="md"
      footer={<>
        <Btn variant="outline" onClick={onDelete} className="!text-rose-600 !border-rose-200 hover:!bg-rose-50">O‘chirish</Btn>
        <div className="flex-1" />
        <Btn variant="outline" onClick={onClose}>Yopish</Btn>
        <Btn icon={Send} onClick={() => text.trim() && onReply(text.trim())} disabled={!text.trim()}>Javob yuborish</Btn>
      </>}
    >
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{m.body}</div>

        {m.replies?.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase text-slate-500 mb-2">Avvalgi javoblar</div>
            <div className="space-y-2">
              {m.replies.map((r, i) => (
                <div key={i} className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-sm text-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-emerald-700 font-semibold mb-1">
                    <span>{r.by || 'Admin'}</span>
                    <span>{fmtUZ(r.at)}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{r.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label>Javob matni</Label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={4}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none resize-none"
            placeholder="Javobingizni yozing..."
          />
        </div>
      </div>
    </Modal>
  );
}
