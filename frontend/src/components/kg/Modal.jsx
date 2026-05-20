import React, { useEffect } from 'react';

export default function KgModal({ open, onClose, title, subtitle, footer, width = 520, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="kg-overlay" onClick={onClose}>
      <div className="kg-modal" style={{ width }} onClick={(e) => e.stopPropagation()}>
        {(title || subtitle) && (
          <div className="kg-modal-head">
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
        )}
        <div className="kg-modal-body">{children}</div>
        {footer && <div className="kg-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
