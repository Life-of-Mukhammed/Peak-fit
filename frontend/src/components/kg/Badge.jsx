import React from 'react';

export default function Badge({ tone = 'default', dot, children, style }) {
  const cls = tone === 'default' ? 'badge' : `badge badge-${tone}`;
  return (
    <span className={cls} style={style}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}
