import React from 'react';
import { X, ShieldCheck, Key, Lock, FileText, CheckCircle2, AlertTriangle, Hash } from 'lucide-react';
import { StoredMessageRecord } from '../services/api.js';

interface SecurityInspectorModalProps {
  message: StoredMessageRecord | null;
  onClose: () => void;
}

export const SecurityInspectorModal: React.FC<SecurityInspectorModalProps> = ({ message, onClose }) => {
  if (!message) return null;

  let parsedAad: any = null;
  try {
    parsedAad = JSON.parse(message.canonicalAAD);
  } catch {
    parsedAad = { raw: message.canonicalAAD };
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                Cryptographic Envelope Inspector
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Message ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{message.messageId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Security Primitives Summary Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Key Agreement
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginTop: '0.25rem' }}>
              X25519 (ECDH)
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
              <CheckCircle2 size={12} /> Ephemeral-Static Forward Secrecy
            </div>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Key Derivation Function
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginTop: '0.25rem' }}>
              HKDF-SHA-256 (RFC 5869)
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
              <CheckCircle2 size={12} /> Domain Separated Extract & Expand
            </div>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Symmetric Cipher
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginTop: '0.25rem' }}>
              AES-256-GCM (NIST SP 800-38D)
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
              <CheckCircle2 size={12} /> 128-bit Tag & 96-bit Unique CSPRNG IV
            </div>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Digital Signature
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginTop: '0.25rem' }}>
              Ed25519 (RFC 8032)
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
              <CheckCircle2 size={12} /> Sender Identity Non-Repudiation
            </div>
          </div>
        </div>

        {/* Detailed Cryptographic Parameters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
              Ephemeral Public Key (ek_pub, 32 bytes Base64):
            </label>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '0.375rem', wordBreak: 'break-all', marginTop: '0.25rem' }}>
              {message.ephemeralPublicKey}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
              Initialization Vector / Nonce (96 bits Base64):
            </label>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '0.375rem', wordBreak: 'break-all', marginTop: '0.25rem' }}>
              {message.nonce}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
              AES-GCM GHASH Authentication Tag (128 bits Base64):
            </label>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '0.375rem', wordBreak: 'break-all', marginTop: '0.25rem' }}>
              {message.authTag}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
              Sender Ed25519 Signature (64 bytes Base64):
            </label>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '0.375rem', wordBreak: 'break-all', marginTop: '0.25rem' }}>
              {message.signature}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
              Canonical Authenticated Additional Data (AAD JSON Structure):
            </label>
            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.5rem', backgroundColor: '#0f172a', color: '#38bdf8', borderRadius: '0.375rem', overflowX: 'auto', marginTop: '0.25rem' }}>
              {JSON.stringify(parsedAad, null, 2)}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
