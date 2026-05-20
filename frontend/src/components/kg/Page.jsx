import React from 'react';

export default function Page({ title, subtitle, actions, children }) {
  return (
    <>
      {(title || subtitle) && (
        <div className="kg-page-head">
          <div>
            {title && <h1>{title}</h1>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="actions">{actions}</div>}
        </div>
      )}
      {children}
    </>
  );
}
