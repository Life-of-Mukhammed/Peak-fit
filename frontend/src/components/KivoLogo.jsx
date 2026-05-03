import React from 'react';

// Kivo logo — gradient rounded square with a stylized K mark.
// Variants: 'light' (white text on dark bg) | 'dark' (slate text on light bg) | 'mark' (icon only)
export default function KivoLogo({ size = 40, variant = 'light', subtitle, className = '', wordmarkClass = '' }) {
  const Mark = (
    <div
      className="rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0 relative overflow-hidden"
      style={{ width: size, height: size }}
    >
      {/* subtle highlight */}
      <span
        className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none"
        style={{ borderRadius: 'inherit' }}
      />
      <svg
        viewBox="0 0 32 32"
        width={size * 0.55}
        height={size * 0.55}
        fill="none"
        className="relative"
        aria-hidden="true"
      >
        <path
          d="M9 6 V26 M9 16 L20 6 M9 16 L22 26"
          stroke="white"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );

  if (variant === 'mark') return <div className={className}>{Mark}</div>;

  const textColor = variant === 'dark' ? 'text-slate-900' : 'text-white';
  const subColor  = variant === 'dark' ? 'text-slate-500' : 'text-emerald-400/80';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {Mark}
      <div className="min-w-0">
        <div className={`font-extrabold leading-tight tracking-tight ${textColor} ${wordmarkClass || 'text-[15px]'}`}>Kivo</div>
        {subtitle && <div className={`text-[11px] leading-tight ${subColor}`}>{subtitle}</div>}
      </div>
    </div>
  );
}
