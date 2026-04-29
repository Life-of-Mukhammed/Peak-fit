import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const BranchContext = createContext(null);

export function BranchProvider({ children }) {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [selected, setSelected] = useState(() => {
    const saved = localStorage.getItem('selectedBranch');
    return saved ? JSON.parse(saved) : null;
  });

  const fetchBranches = async () => {
    if (!localStorage.getItem('token')) return;     // skip if not logged in
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
      if (!selected && res.data.length > 0) {
        const main = res.data.find(b => b.isMain) || res.data[0];
        setSelected(main);
        localStorage.setItem('selectedBranch', JSON.stringify(main));
      }
    } catch { }
  };

  // Refetch when the authenticated user changes (login / logout)
  useEffect(() => {
    if (user) fetchBranches();
    else { setBranches([]); setSelected(null); localStorage.removeItem('selectedBranch'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id || user?._id]);

  const selectBranch = (branch) => {
    setSelected(branch);
    if (branch) {
      localStorage.setItem('selectedBranch', JSON.stringify(branch));
    } else {
      localStorage.removeItem('selectedBranch');
    }
  };

  return (
    <BranchContext.Provider value={{ branches, selected, selectBranch, fetchBranches }}>
      {children}
    </BranchContext.Provider>
  );
}

export const useBranch = () => useContext(BranchContext);
