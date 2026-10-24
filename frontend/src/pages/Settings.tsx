import React from 'react';
import { User, Shield, Laptop, Key, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { user, clientKeys, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
          Account & Device Identity Settings
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Review your authenticated account profile, client cryptographic identity, and active sessions.
        </p>
      </div>

      {/* Profile Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>Personal Identity</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered research identity profile</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8125rem' }}>
          <div>
            <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Full Name:</label>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>{user?.fullName}</div>
          </div>
          <div>
            <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Email Address:</label>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>{user?.email}</div>
          </div>
          <div>
            <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>User ID:</label>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#64748b' }}>{user?.id}</div>
          </div>
          <div>
            <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Account Created:</label>
            <div style={{ color: '#0f172a' }}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Session'}</div>
          </div>
        </div>
      </div>

      {/* Device & Keyring Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Laptop size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>Client Device & Crypto Storage</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Local sandbox storage of cryptographic key material</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>Client Key Storage Mode</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Browser Sandboxed KeyRing (Session & Encrypted Cache)</div>
            </div>
            <span className="badge badge-green">Isolated</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>Key Fingerprint</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#2563eb' }}>
                {clientKeys?.fingerprint || 'Not initialized'}
              </div>
            </div>
            <span className="badge badge-blue">v{clientKeys?.version || 1}</span>
          </div>
        </div>
      </div>

      {/* Session Management */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
          Session Management
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Logging out clears your session token and flushes sensitive volatile key material from memory.
        </p>

        <button onClick={handleLogout} className="btn btn-danger">
          <LogOut size={16} /> Terminate Session & Log Out
        </button>
      </div>
    </div>
  );
};
