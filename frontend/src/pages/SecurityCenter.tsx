import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Shield,
  ShieldCheck,
  RefreshCw,
  QrCode,
  Copy,
  Check,
  Activity,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { apiGetSecurityEvents, SecurityEventLog } from '../services/api.js';

export const SecurityCenter: React.FC = () => {
  const { user, clientKeys, rotateMyKeys } = useAuth();

  const [events, setEvents] = useState<SecurityEventLog[]>([]);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [copiedSafetyNumber, setCopiedSafetyNumber] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationSuccess, setRotationSuccess] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      const res = await apiGetSecurityEvents();
      setEvents(res.events);
    } catch (err) {
      console.error('Failed to load security audit events:', err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCopy = (text: string, type: 'FP' | 'SN') => {
    navigator.clipboard.writeText(text);
    if (type === 'FP') {
      setCopiedFingerprint(true);
      setTimeout(() => setCopiedFingerprint(false), 2000);
    } else {
      setCopiedSafetyNumber(true);
      setTimeout(() => setCopiedSafetyNumber(false), 2000);
    }
  };

  const handleRotate = async () => {
    if (
      !window.confirm(
        'Are you sure you want to rotate your cryptographic keypair? Previous public keys will be marked revoked, and a fresh X25519 and Ed25519 keypair will be registered.'
      )
    ) {
      return;
    }

    setIsRotating(true);
    setRotationSuccess(null);
    try {
      await rotateMyKeys();
      setRotationSuccess('Cryptographic keys successfully rotated. New version registered in cloud directory.');
      await loadEvents();
    } catch (err: any) {
      alert(`Key rotation failed: ${err.message}`);
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
          Cryptographic Security Center
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Manage your client keyrings, verify out-of-band safety numbers, and audit cloud security events.
        </p>
      </div>

      {rotationSuccess && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', color: '#166534', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={16} />
          <span>{rotationSuccess}</span>
        </div>
      )}

      {/* Grid: Keyring Status & Safety Number */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Card 1: Active Cryptographic Keypair */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <KeyRound size={20} color="#2563eb" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Active Identity Keys</h3>
            </div>
            <span className="badge badge-green">Version {clientKeys?.version || 1}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Diffie–Hellman Curve:</span>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>Curve25519 / X25519 (32 bytes)</div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Digital Signature Algorithm:</span>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>Ed25519 (Edwards curve, 64-byte sig)</div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Key ID:</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#334155' }}>
                {clientKeys?.keyId}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Public Key SHA-256 Fingerprint:</span>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6875rem',
                  padding: '0.5rem',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '0.375rem',
                  wordBreak: 'break-all',
                  marginTop: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{clientKeys?.fingerprint}</span>
                <button
                  onClick={() => handleCopy(clientKeys?.fingerprint || '', 'FP')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: '0.25rem' }}
                >
                  {copiedFingerprint ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <button
              onClick={handleRotate}
              disabled={isRotating}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
            >
              <RefreshCw size={14} className={isRotating ? 'spin' : ''} />
              {isRotating ? 'Rotating Keys...' : 'Rotate Identity Keypair'}
            </button>
          </div>
        </div>

        {/* Card 2: Visual Safety Number (Out-of-Band Verification) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="#10b981" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>60-Digit Safety Number</h3>
            </div>
            <span className="badge badge-blue">Out-of-Band Trust</span>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            To prevent Man-in-the-Middle (MITM) and public-key substitution attacks by untrusted servers, verify this safety number with your peer via a trusted secondary channel.
          </p>

          <div
            style={{
              padding: '1rem',
              backgroundColor: '#0f172a',
              borderRadius: '0.5rem',
              color: '#38bdf8',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              letterSpacing: '0.1em',
              textAlign: 'center',
              lineHeight: 1.8,
              wordBreak: 'break-all',
            }}
          >
            {clientKeys?.safetyNumber || 'Computing Safety Number...'}
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => handleCopy(clientKeys?.safetyNumber || '', 'SN')}
              className="btn btn-secondary btn-sm"
            >
              {copiedSafetyNumber ? (
                <>
                  <Check size={14} color="#16a34a" /> Copied Safety Number
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Safety Number
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Security Event History Audit Trail */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="#64748b" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
              Security & Audit Event History
            </h3>
          </div>
          <button onClick={loadEvents} className="btn btn-secondary btn-sm">
            <RefreshCw size={12} /> Refresh Log
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.625rem 0.75rem' }}>Timestamp</th>
                <th style={{ padding: '0.625rem 0.75rem' }}>Event Type</th>
                <th style={{ padding: '0.625rem 0.75rem' }}>Status</th>
                <th style={{ padding: '0.625rem 0.75rem' }}>Audited Details</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No security events recorded yet.
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.625rem 0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600, color: '#0f172a' }}>
                      {evt.eventType}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem' }}>
                      <span
                        className={`badge ${
                          evt.status === 'SUCCESS'
                            ? 'badge-green'
                            : evt.status === 'WARNING'
                            ? 'badge-amber'
                            : 'badge-red'
                        }`}
                      >
                        {evt.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', color: '#334155' }}>{evt.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
