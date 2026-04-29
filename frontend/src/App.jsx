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

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-sidebar">
      <div className="text-accent text-2xl font-bold animate-pulse">Peak Fit</div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
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
