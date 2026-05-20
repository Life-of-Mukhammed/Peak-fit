import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BranchProvider } from './context/BranchContext';
import { TariffsProvider } from './context/TariffsContext';
import { SmenaProvider } from './context/SmenaContext';
import Layout from './components/Layout';
import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import Kassa from './pages/Kassa';
import Mijozlar from './pages/Mijozlar';
import Ombor from './pages/Ombor';
import Tariflar from './pages/Tariflar';
import Xodimlar from './pages/Xodimlar';
import Filiallar from './pages/Filiallar';
import Hisobotlar from './pages/Hisobotlar';
import Sozlamalar from './pages/Sozlamalar';
import Profil from './pages/Profil';
import Viloyatlar from './pages/Viloyatlar';
import Tumanlar from './pages/Tumanlar';
import Dillerlar from './pages/Dillerlar';
import AuditLog from './pages/AuditLog';

// Default landing route per role
const HOME_BY_ROLE = {
  superadmin: '/dashboard',
  admin:      '/dashboard',
  manager:    '/dashboard',
  cashier:    '/',
};

// Which routes each role can open. Anything missing → redirected home.
const ALLOWED = {
  superadmin: ['*'],
  admin:      ['/dashboard', '/', '/mijozlar', '/ombor', '/tariflar', '/xodimlar', '/filiallar', '/clublar', '/hisobotlar', '/sozlamalar', '/profil'],
  manager:    ['/dashboard', '/', '/mijozlar', '/ombor', '/hisobotlar', '/profil'],
  cashier:    ['/', '/mijozlar', '/profil'],
};

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ color: 'var(--accent)', fontSize: 22, fontWeight: 700 }}>KiGo</div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
}

function RoleGate({ path, children }) {
  const { user } = useAuth();
  const role = user?.role || 'cashier';
  const allowed = ALLOWED[role] || [];
  if (allowed.includes('*') || allowed.includes(path)) return children;
  return <Navigate to={HOME_BY_ROLE[role] || '/'} replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  const home = HOME_BY_ROLE[user?.role] || '/';
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={home} /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<RoleGate path="/"><Kassa /></RoleGate>} />
        <Route path="dashboard"  element={<RoleGate path="/dashboard"><Dashboard /></RoleGate>} />
        <Route path="mijozlar"   element={<RoleGate path="/mijozlar"><Mijozlar /></RoleGate>} />
        <Route path="ombor"      element={<RoleGate path="/ombor"><Ombor /></RoleGate>} />
        <Route path="tariflar"   element={<RoleGate path="/tariflar"><Tariflar /></RoleGate>} />
        <Route path="xodimlar"   element={<RoleGate path="/xodimlar"><Xodimlar /></RoleGate>} />
        <Route path="filiallar"  element={<RoleGate path="/filiallar"><Filiallar /></RoleGate>} />
        <Route path="clublar"    element={<RoleGate path="/clublar"><Filiallar /></RoleGate>} />
        <Route path="hisobotlar" element={<RoleGate path="/hisobotlar"><Hisobotlar /></RoleGate>} />
        <Route path="sozlamalar" element={<RoleGate path="/sozlamalar"><Sozlamalar /></RoleGate>} />
        <Route path="profil"     element={<RoleGate path="/profil"><Profil /></RoleGate>} />
        <Route path="viloyatlar" element={<RoleGate path="/viloyatlar"><Viloyatlar /></RoleGate>} />
        <Route path="tumanlar"   element={<RoleGate path="/tumanlar"><Tumanlar /></RoleGate>} />
        <Route path="dillerlar"  element={<RoleGate path="/dillerlar"><Dillerlar /></RoleGate>} />
        <Route path="audit"      element={<RoleGate path="/audit"><AuditLog /></RoleGate>} />
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
                toastOptions={{ style: { background: '#1C1917', color: '#fff', border: '1px solid #16A34A' } }}
              />
              <AppRoutes />
            </BrowserRouter>
          </SmenaProvider>
        </TariffsProvider>
      </BranchProvider>
    </AuthProvider>
  );
}
