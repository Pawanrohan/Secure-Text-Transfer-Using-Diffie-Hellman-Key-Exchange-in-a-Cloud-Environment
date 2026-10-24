import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Sidebar } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { Login } from './pages/Login.js';
import { Register } from './pages/Register.js';
import { Dashboard } from './pages/Dashboard.js';
import { Compose } from './pages/Compose.js';
import { SecurityCenter } from './pages/SecurityCenter.js';
import { CloudVault } from './pages/CloudVault.js';
import { ResearchEvaluation } from './pages/ResearchEvaluation.js';
import { EducationalLab } from './pages/EducationalLab.js';
import { Settings } from './pages/Settings.js';

const ProtectedLayout: React.FC<{ children: React.ReactNode; title: string; subtitle?: string }> = ({
  children,
  title,
  subtitle,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Initializing SecureText...</div>
          <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>Verifying client keyring & session</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header
          title={title}
          subtitle={subtitle}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedLayout title="Secure Messaging Dashboard" subtitle="End-to-End Encrypted Cloud Communications">
                <Dashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/compose"
            element={
              <ProtectedLayout title="Compose Message" subtitle="Send an Encrypted Envelope to a Verified Identity">
                <Compose />
              </ProtectedLayout>
            }
          />
          <Route
            path="/security"
            element={
              <ProtectedLayout title="Security Center" subtitle="Identity Keyrings, Fingerprints & Out-of-Band Safety Numbers">
                <SecurityCenter />
              </ProtectedLayout>
            }
          />
          <Route
            path="/vault"
            element={
              <ProtectedLayout title="Zero-Knowledge Cloud Storage" subtitle="Encrypted Envelopes Stored in Cloud Database">
                <CloudVault />
              </ProtectedLayout>
            }
          />
          <Route
            path="/evaluation"
            element={
              <ProtectedLayout title="Research Evaluation" subtitle="Experimental Cryptographic Benchmarks & Performance Data">
                <ResearchEvaluation />
              </ProtectedLayout>
            }
          />
          <Route
            path="/educational-lab"
            element={
              <ProtectedLayout title="Educational Cryptography Lab" subtitle="Finite-Field DH, RSA-OAEP/PSS & Historical Playfair Cipher">
                <EducationalLab />
              </ProtectedLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedLayout title="Settings & Profile" subtitle="Device Configuration and Session Management">
                <Settings />
              </ProtectedLayout>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
