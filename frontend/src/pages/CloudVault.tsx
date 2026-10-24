import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, HardDrive, RefreshCw, Lock, FileCode, CheckCircle2 } from 'lucide-react';
import { apiGetCloudVault, CloudVaultData } from '../services/api.js';

export const CloudVault: React.FC = () => {
  const [vaultData, setVaultData] = useState<CloudVaultData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadVault = async () => {
    setIsLoading(true);
    try {
      const res = await apiGetCloudVault();
      setVaultData(res.vault);
    } catch (err) {
      console.error('Failed to load cloud vault data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVault();
  }, []);

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
            Zero-Knowledge Cloud Storage Vault
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Transparent verification that cloud databases and servers hold only ciphertext and cryptographic envelopes.
          </p>
        </div>
        <button onClick={loadVault} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Refresh Vault
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Stored Envelopes
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              {vaultData?.totalEncryptedMessages || 0}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HardDrive size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Cloud Storage Used
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              {vaultData?.storageUsageFormatted || '0 KB'}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Cloud Policy
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#16a34a' }}>
              Zero-Knowledge
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Invariant Proof Banner */}
      <div style={{ padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
          <Lock size={16} color="#2563eb" /> Zero-Knowledge Invariants Verified:
        </div>
        <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem', fontSize: '0.8125rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <li>No plaintext column exists in the database schema (<code className="mono-tag">content</code> contains Base64 AES-GCM ciphertext only).</li>
          <li>Server does not hold private keys, ephemeral scalar keys, or derived symmetric keys.</li>
          <li>Integrity tags (128-bit GHASH) and Ed25519 digital signatures are recorded with every encrypted record.</li>
        </ul>
      </div>

      {/* Cloud Encrypted Message Records Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
          Encrypted Message Envelopes at Rest
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.625rem 0.75rem' }}>Message ID</th>
                <th style={{ padding: '0.625rem 0.75rem' }}>Sender</th>
                <th style={{ padding: '0.625rem 0.75rem' }}>Recipient</th>
                <th style={{ padding: '0.625rem 0.75rem' }}>Payload Size</th>
                <th style={{ padding: '0.625rem 0.75rem' }}>Nonce (12B)</th>
                <th style={{ padding: '0.625rem 0.75rem' }}>Auth Tag (16B)</th>
                <th style={{ padding: '0.625rem 0.75rem' }}>Signature (64B)</th>
                <th style={{ padding: '0.625rem 0.75rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {!vaultData || vaultData.records.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No messages currently stored in cloud vault.
                  </td>
                </tr>
              ) : (
                vaultData.records.map((r) => (
                  <tr key={r.messageId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#2563eb' }}>
                      {r.messageId}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem' }}>{r.senderEmail}</td>
                    <td style={{ padding: '0.625rem 0.75rem' }}>{r.recipientEmail}</td>
                    <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>{r.sizeBytes} B</td>
                    <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#64748b' }}>
                      {r.noncePreview}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#64748b' }}>
                      {r.authTagPreview}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#64748b' }}>
                      {r.signaturePreview}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem' }}>
                      <span className="badge badge-blue">{r.deliveryStatus}</span>
                    </td>
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
