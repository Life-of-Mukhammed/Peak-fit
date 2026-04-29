import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const TariffsContext = createContext(null);

export function TariffsProvider({ children }) {
  const { user } = useAuth();
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('token')) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get('/tariffs');
      setTariffs(res.data);
    } catch { setTariffs([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (user) refresh();
    else { setTariffs([]); setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id || user?._id]);

  return (
    <TariffsContext.Provider value={{ tariffs, loading, refresh, hasTariffs: tariffs.length > 0 }}>
      {children}
    </TariffsContext.Provider>
  );
}

export const useTariffs = () => useContext(TariffsContext);
