import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Shield,
  MessageSquare,
  PlusCircle,
  KeyRound,
  Database,
  BarChart2,
  BookOpen,
  Settings,
  LogOut,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const { user, clientKeys, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Messaging', path: '/', icon: MessageSquare },
    { name: 'Compose Secure Text', path: '/compose', icon: PlusCircle },
    { name: 'Security Center', path: '/security', icon: KeyRound },
    { name: 'Cloud Storage Vault', path: '/vault', icon: Database },
    { name: 'Research Evaluation', path: '/evaluation', icon: BarChart2 },
    { name: 'Educational Crypto Lab', path: '/educational-lab', icon: BookOpen },
    { name: 'Settings & Identity', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-sidebar)',
        color: 'var(--text-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        borderRight: '1px solid #1e293b',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 10px rgba(37,99,235,0.4)',
          }}
        >
          <Shield size={22} />
        </div>
        <div>
          <h1
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: 'var(--text-sidebar-bright)',
              letterSpacing: '-0.025em',
            }}
          >
            SecureText
          </h1>
          <div
            style={{
              fontSize: '0.6875rem',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <Lock size={10} /> X25519 · E2EE Cloud
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
        <div
          style={{
            fontSize: '0.6875rem',
            textTransform: 'uppercase',
            color: '#64748b',
            fontWeight: 600,
            padding: '0.5rem 0.75rem',
            letterSpacing: '0.05em',
          }}
        >
          Core Platform
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    textDecoration: 'none',
                    color: isActive ? '#ffffff' : 'var(--text-sidebar)',
                    backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                    transition: 'all 0.15s ease',
                  })}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Identity & Key Info Card */}
      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid #1e293b',
          backgroundColor: '#090d16',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#f8fafc',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {user?.fullName || 'Authenticated User'}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {user?.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.375rem',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>

        {clientKeys && (
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.375rem 0.5rem',
              backgroundColor: '#1e293b',
              borderRadius: '0.375rem',
              fontSize: '0.6875rem',
              color: '#38bdf8',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>FP: {clientKeys.fingerprint.substring(0, 9)}...</span>
            <span style={{ color: '#10b981', fontSize: '0.625rem', fontWeight: 600 }}>v{clientKeys.version}</span>
          </div>
        )}
      </div>
    </aside>
  );
};
