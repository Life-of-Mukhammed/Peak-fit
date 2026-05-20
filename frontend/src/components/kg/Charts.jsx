import React from 'react';

export function Sparkline({ data, color = 'var(--accent)', w = 120, h = 36, fill = true }) {
  if (!data?.length) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1 || 1);
  const pts = data.map((v, i) => [i * stepX, h - ((v - min) / range) * (h - 4) - 2]);
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${d} L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {fill && <path d={area} fill={color} opacity="0.12" />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function Donut({ segments, size = 160, thickness = 22 }) {
  const total = segments.reduce((a, b) => a + (b.v || 0), 0) || 1;
  let acc = 0;
  const stops = segments.map(s => {
    const start = (acc / total) * 100;
    acc += (s.v || 0);
    const end = (acc / total) * 100;
    return `${s.c} ${start}% ${end}%`;
  }).join(', ');
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `conic-gradient(${stops})`, position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: thickness, background: 'var(--card)', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Jami</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{segments.reduce((a, b) => a + (b.v || 0), 0)}</div>
        </div>
      </div>
    </div>
  );
}

export function BarChart({ data, labels, height = 180 }) {
  const max = Math.max(...data, 1);
  return (
    <div className="bar-chart" style={{ height }}>
      {data.map((v, i) => (
        <div className="col" key={i}>
          <div className="bar" style={{ height: `${(v / max) * 100}%` }}>
            <div className="fill" style={{ height: i === data.length - 1 ? '100%' : '70%' }} />
          </div>
          <div>{labels?.[i] ?? i}</div>
        </div>
      ))}
    </div>
  );
}
