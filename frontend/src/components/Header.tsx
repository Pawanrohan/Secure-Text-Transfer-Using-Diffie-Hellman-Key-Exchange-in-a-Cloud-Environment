import React from 'react';
import { ShieldCheck, Lock, Activity, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onMenuToggle }) => {
  const { user } = useAuth();

  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-light)',
        padding: '0.875rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-main)',
              padding: '0.25rem',
            }}
          >
            <Menu size={22} />
          </button>
        )}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{subtitle}</p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Security Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.75rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            color: '#166534',
            fontWeight: 500,
          }}
        >
          <ShieldCheck size={14} color="#16a34a" />
          <span>Zero-Knowledge Cloud Active</span>
        </div>

        {/* Cryptographic Stack Tag */}
        <div
          style={{
            display: 'none',
            fontSize: '0.75rem',
            color: '#475569',
            fontFamily: 'var(--font-mono)',
            padding: '0.375rem 0.625rem',
            backgroundColor: '#f1f5f9',
            borderRadius: '0.375rem',
            border: '1px solid #e2e8f0',
          }}
          className="desktop-crypto-tag"
        >
          <Lock size={12} style={{ display: 'inline', marginRight: '4px' }} />
          X25519 + AES-256-GCM + Ed25519
        </div>
      </div>
    </header>
  );
};
