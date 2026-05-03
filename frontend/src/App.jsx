import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BranchProvider } from './context/BranchContext';
import { TariffsProvider } from './context/TariffsContext';
import { SmenaProvider } from './context/SmenaContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Kassa from './pages/Kassa';
import Mijozlar from './pages/Mijozlar';
import Ombor from './pages/Ombor';
import Tariflar from './pages/Tariflar';
import Xodimlar from './pages/Xodimlar';
import Filiallar from './pages/Filiallar';
import Hisobotlar from './pages/Hisobotlar';
import Sozlamalar from './pages/Sozlamalar';
import Profil from './pages/Profil';

import PlatformLayout from './fitos/PlatformLayout';
import FitosViloyatlar from './fitos/pages/Viloyatlar';
import FitosXizmatlar from './fitos/pages/Xizmatlar';
import FitosTariflar from './fitos/pages/Tariflar';
import FitosMijozlar from './fitos/pages/Mijozlar';
import FitosTolovlar from './fitos/pages/Tolovlar';
import FitosXabarlar from './fitos/pages/Xabarlar';
import FitosDiller from './fitos/pages/Diller';
import FitosSozlamalar from './fitos/pages/Sozlamalar';

function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-sidebar">
      <div className="text-accent text-2xl font-bold animate-pulse tracking-tight">Kivo</div>
    </div>
  );
}

function PrivateRoute({ children, require }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  if (require === 'platform' && user.role !== 'platformAdmin') return <Navigate to="/" />;
  if (require === 'club' && user.role === 'platformAdmin') return <Navigate to="/fitos" />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;

  const homeFor = (u) => (u?.role === 'platformAdmin' ? '/fitos' : '/');

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={homeFor(user)} /> : <Login />} />

      <Route path="/fitos" element={<PrivateRoute require="platform"><PlatformLayout /></PrivateRoute>}>
        <Route index            element={<FitosViloyatlar />} />
        <Route path="xizmatlar" element={<FitosXizmatlar />} />
        <Route path="tariflar"  element={<FitosTariflar />} />
        <Route path="mijozlar"  element={<FitosMijozlar />} />
        <Route path="tolovlar"  element={<FitosTolovlar />} />
        <Route path="xabarlar"  element={<FitosXabarlar />} />
        <Route path="diller"    element={<FitosDiller />} />
        <Route path="sozlamalar" element={<FitosSozlamalar />} />
      </Route>

      <Route path="/" element={<PrivateRoute require="club"><Layout /></PrivateRoute>}>
        <Route index element={<Kassa />} />
        <Route path="mijozlar" element={<Mijozlar />} />
        <Route path="ombor" element={<Ombor />} />
        <Route path="tariflar" element={<Tariflar />} />
        <Route path="xodimlar" element={<Xodimlar />} />
        <Route path="filiallar" element={<Filiallar />} />
        <Route path="hisobotlar" element={<Hisobotlar />} />
        <Route path="sozlamalar" element={<Sozlamalar />} />
        <Route path="profil" element={<Profil />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BranchProvider>
        <TariffsProvider>
        <SmenaProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{ style: { background: '#0f172a', color: '#fff', border: '1px solid #22c55e' } }}
          />
          <AppRoutes />
        </BrowserRouter>
        </SmenaProvider>
        </TariffsProvider>
      </BranchProvider>
    </AuthProvider>
  );
}
