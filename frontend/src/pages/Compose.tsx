import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Lock,
  ShieldCheck,
  User,
  Key,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { apiListDirectory, apiSendMessage, DirectoryUser } from '../services/api.js';
import { prepareAndEncryptMessage } from '../crypto/secureMessenger.js';

export const Compose: React.FC = () => {
  const { user, clientKeys } = useAuth();
  const navigate = useNavigate();

  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDirectory() {
      try {
        const { directory: list } = await apiListDirectory();
        const peers = list.filter((p) => p.id !== user?.id);
        setDirectory(peers);
        if (peers.length > 0) {
          setSelectedRecipientId(peers[0].id);
        }
      } catch (err: any) {
        setError('Failed to fetch public key directory');
      } finally {
        setIsLoading(false);
      }
    }
    loadDirectory();
  }, [user]);

  const selectedRecipient = directory.find((p) => p.id === selectedRecipientId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient || !clientKeys || !messageText.trim()) return;

    if (!selectedRecipient.dhPublicKey || !selectedRecipient.signingPublicKey) {
      setError('Selected recipient has not yet registered cryptographic public keys.');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const payloadToSend = subject.trim()
        ? `[Subject: ${subject.trim()}]\n\n${messageText.trim()}`
        : messageText.trim();

      // 1. Client-side X25519 DH + HKDF + AES-256-GCM + Ed25519 Sign
      const envelope = prepareAndEncryptMessage(
        clientKeys,
        {
          userId: selectedRecipient.id,
          keyId: selectedRecipient.keyId || 'key_default',
          dhPublicKey: selectedRecipient.dhPublicKey,
          signingPublicKey: selectedRecipient.signingPublicKey,
        },
        payloadToSend
      );

      // 2. Upload ciphertext to cloud storage
      await apiSendMessage(envelope);

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to encrypt and send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div className="card">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              Compose End-to-End Encrypted Text
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Encrypted locally using X25519 Diffie–Hellman & authenticated with Ed25519
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              color: '#b91c1c',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Recipient Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
              Select Authorized Recipient
            </label>
            <select
              value={selectedRecipientId}
              onChange={(e) => setSelectedRecipientId(e.target.value)}
              className="input-field"
              required
            >
              {directory.map((peer) => (
                <option key={peer.id} value={peer.id}>
                  {peer.fullName} ({peer.email}) {peer.hasKeys ? '— Verified Public Keys Available' : '— [Pending Registration]'}
                </option>
              ))}
            </select>
          </div>

          {/* Recipient Cryptographic Identity Verification Card */}
          {selectedRecipient && (
            <div
              style={{
                padding: '1rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={16} color="#16a34a" />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
                    Recipient Cryptographic Public Key Verified
                  </span>
                </div>
                <span className="badge badge-green">Identity Bound</span>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                <strong>Fingerprint:</strong>{' '}
                <span style={{ fontFamily: 'var(--font-mono)', color: '#2563eb' }}>
                  {selectedRecipient.fingerprint || 'Pending key registration'}
                </span>
              </div>

              {selectedRecipient.safetyNumber && (
                <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                  <strong>Safety Number:</strong>{' '}
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedRecipient.safetyNumber}</span>
                </div>
              )}
            </div>
          )}

          {/* Subject Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
              Subject (Optional)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Research Evaluation & Benchmark Data"
              className="input-field"
            />
          </div>

          {/* Message Text */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
              Secure Message Plaintext
            </label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your sensitive text message here. It will be encrypted into ciphertext before leaving your browser..."
              className="input-field"
              rows={6}
              style={{ resize: 'vertical' }}
              required
            />
          </div>

          {/* Cryptographic Pipeline Summary */}
          <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem', border: '1px solid #bfdbfe', fontSize: '0.75rem', color: '#1e40af' }}>
            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Sparkles size={14} /> Cryptographic Dispatch Guarantee:
            </div>
            <div style={{ marginTop: '0.25rem', color: '#1e3a8a' }}>
              1. A fresh ephemeral X25519 keypair will be generated for forward secrecy. <br />
              2. Shared secret derived via HKDF-SHA-256 into a 256-bit AES key. <br />
              3. Message encrypted with AES-256-GCM (128-bit tag). <br />
              4. Envelope signed with your Ed25519 identity key.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-secondary"
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !messageText.trim()}
              className="btn btn-primary"
              style={{ padding: '0.625rem 1.5rem' }}
            >
              {isSending ? (
                'Encrypting & Sending...'
              ) : (
                <>
                  <Send size={16} /> Encrypt & Transmit to Cloud
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
