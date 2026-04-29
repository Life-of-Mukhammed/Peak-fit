import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const SmenaContext = createContext();
export const useSmena = () => useContext(SmenaContext);

export function SmenaProvider({ children }) {
  const { user } = useAuth();
  const [currentSmena, setCurrentSmena] = useState(null); // globally open smena
  const [loading, setLoading] = useState(true);
  const [closeReport, setCloseReport] = useState(null);

  useEffect(() => {
    if (user) fetchCurrent();
    else { setCurrentSmena(null); setLoading(false); }
  }, [user]);

  const fetchCurrent = async () => {
    setLoading(true);
    try {
      const res = await api.get('/smena/current');
      setCurrentSmena(res.data);
    } catch {} finally { setLoading(false); }
  };

  const openSmena = async () => {
    const res = await api.post('/smena/open');
    setCurrentSmena(res.data);
    return res.data;
  };

  const closeSmena = async () => {
    const res = await api.post('/smena/close');
    setCurrentSmena(null);
    setCloseReport(res.data);
    return res.data;
  };

  // Is current logged-in user the one who opened the smena?
  const isMine = currentSmena && user && currentSmena.openedBy?._id === user.id;
  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';
  const canClose = isMine || isAdmin;

  return (
    <SmenaContext.Provider value={{
      currentSmena, loading,
      openSmena, closeSmena,
      closeReport, setCloseReport,
      fetchCurrent, isMine, canClose,
    }}>
      {children}
    </SmenaContext.Provider>
  );
}
