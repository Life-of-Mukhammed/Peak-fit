import React from 'react';
import { Plus, Search } from 'lucide-react';

export const Card = ({ className = '', children }) => (
  <div className={`bg-white rounded-2xl border border-slate-200/70 shadow-sm ${className}`}>{children}</div>
);

export const Btn = ({ variant = 'primary', icon: Icon, children, className = '', ...rest }) => {
  const variants = {
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/30',
    soft:    'bg-emerald-50 hover:bg-emerald-100 text-emerald-700',
    outline: 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700',
    danger:  'bg-rose-500 hover:bg-rose-600 text-white',
    ghost:   'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
    dark:    'bg-slate-900 hover:bg-slate-800 text-white',
  };
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};

export const IconBtn = ({ icon: Icon, color = 'slate', className = '', ...rest }) => {
  const tones = {
    slate:   'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
    emerald: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50',
    amber:   'text-amber-600 hover:text-amber-700 hover:bg-amber-50',
    rose:    'text-rose-500 hover:text-rose-700 hover:bg-rose-50',
    blue:    'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
  };
  return (
    <button {...rest} className={`p-2 rounded-lg transition-colors ${tones[color]} ${className}`}>
      <Icon size={16} />
    </button>
  );
};

export const Input = React.forwardRef(({ className = '', ...rest }, ref) => (
  <input
    ref={ref}
    {...rest}
    className={`w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all outline-none ${className}`}
  />
));

export const Select = ({ className = '', children, ...rest }) => (
  <select
    {...rest}
    className={`w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all outline-none ${className}`}
  >{children}</select>
);

export const Label = ({ children, required, className = '' }) => (
  <label className={`block text-slate-700 text-xs mb-1.5 font-semibold uppercase tracking-wide ${className}`}>
    {children} {required && <span className="text-rose-500">*</span>}
  </label>
);

export const Stat = ({ label, value, icon: Icon, accent = 'emerald', sub }) => {
  const accents = {
    emerald: 'from-emerald-500/10 to-emerald-500/0 text-emerald-600 border-emerald-500/15',
    amber:   'from-amber-500/10 to-amber-500/0 text-amber-600 border-amber-500/15',
    rose:    'from-rose-500/10 to-rose-500/0 text-rose-600 border-rose-500/15',
    blue:    'from-blue-500/10 to-blue-500/0 text-blue-600 border-blue-500/15',
    slate:   'from-slate-500/10 to-slate-500/0 text-slate-600 border-slate-500/15',
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</div>
          {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accents[accent]} border flex items-center justify-center flex-shrink-0`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </Card>
  );
};

export const Badge = ({ tone = 'slate', children, className = '' }) => {
  const tones = {
    slate:   'bg-slate-100 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    rose:    'bg-rose-50 text-rose-700 border-rose-200',
    blue:    'bg-blue-50 text-blue-700 border-blue-200',
    violet:  'bg-violet-50 text-violet-700 border-violet-200',
  };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${tones[tone]} ${className}`}>{children}</span>;
};

export const Toolbar = ({ search, onSearch, placeholder = 'Qidirish...', right }) => (
  <div className="flex items-center justify-between gap-3 mb-5">
    {onSearch ? (
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={search} onChange={e => onSearch(e.target.value)} placeholder={placeholder} className="pl-10" />
      </div>
    ) : <div />}
    <div className="flex items-center gap-2">{right}</div>
  </div>
);

export const Empty = ({ icon: Icon, title, sub, action }) => (
  <Card className="p-12 text-center">
    {Icon && (
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4">
        <Icon size={26} />
      </div>
    )}
    <div className="text-slate-900 font-semibold text-lg">{title}</div>
    {sub && <div className="text-slate-500 text-sm mt-1.5 max-w-sm mx-auto">{sub}</div>}
    {action && <div className="mt-5">{action}</div>}
  </Card>
);

export const AddBtn = ({ onClick, label }) => (
  <Btn icon={Plus} onClick={onClick}>{label}</Btn>
);

export const Modal = ({ open, onClose, title, subtitle, size = 'md', children, footer }) => {
  React.useEffect(() => {
    if (!open) return;
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[92vh] flex flex-col overflow-hidden`} onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-slate-900">{title}</div>
            {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg w-8 h-8 flex items-center justify-center">×</button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

export const fmtUZ = (d) => d ? new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
export const fmtMoney = (n) => new Intl.NumberFormat('uz-UZ').format(n || 0);
