import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useBranch } from '../../context/BranchContext';

export default function KgTopbar({ crumbs = ['KiGo'], onScan, actions }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState('UZ');
  const [branchOpen, setBranchOpen] = useState(false);
  const branchRef = useRef();
  const { branches, selected, selectBranch } = useBranch();

  useEffect(() => {
    const onClick = (e) => { if (branchRef.current && !branchRef.current.contains(e.target)) setBranchOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const onSearchKey = (e) => {
    if (e.key === 'Enter' && search.trim()) navigate(`/mijozlar?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="kg-top">
      <div className="kg-crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            {i === crumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}
          </React.Fragment>
        ))}
      </div>

      <div className="kg-search">
        <Icon name="search" size={16} />
        <input
          placeholder="Qidirish: mijoz, club, diller..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={onSearchKey}
        />
        <span className="kbd">⌘K</span>
      </div>

      <div className="kg-lang">
        {['UZ', 'RU', 'EN'].map(l => (
          <span key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>{l}</span>
        ))}
      </div>

      <div ref={branchRef} style={{ position: 'relative' }}>
        <button className="btn btn-sm" onClick={() => setBranchOpen(o => !o)} style={{ height: 34 }}>
          <Icon name="building" size={14} />
          <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected ? selected.name : 'Barcha clublar'}
          </span>
          <Icon name="chevDown" size={12} />
        </button>
        {branchOpen && (
          <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, minWidth: 240, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-md)', zIndex: 50, padding: 4 }}>
            <button onClick={() => { selectBranch(null); setBranchOpen(false); }} className="kg-nav-item" style={{ width: '100%' }}>
              <Icon name="building" size={14} /> Barcha clublar
              {!selected && <Icon name="check" size={14} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />}
            </button>
            {branches.map(b => (
              <button key={b._id} onClick={() => { selectBranch(b); setBranchOpen(false); }} className="kg-nav-item" style={{ width: '100%' }}>
                <Icon name="building" size={14} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                {selected?._id === b._id && <Icon name="check" size={14} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />}
              </button>
            ))}
          </div>
        )}
      </div>

      <button className="kg-top-btn" title="Notifikatsiyalar">
        <Icon name="bell" />
        <span className="dot" />
      </button>

      {onScan && (
        <button onClick={onScan} className="btn btn-primary btn-sm" style={{ height: 34 }}>
          <Icon name="scan" size={14} /> QR-skaner
        </button>
      )}

      {actions}
    </div>
  );
}
