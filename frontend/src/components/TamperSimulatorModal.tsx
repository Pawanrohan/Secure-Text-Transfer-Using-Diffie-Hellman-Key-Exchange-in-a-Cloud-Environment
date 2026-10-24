import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, Bug, RefreshCw, CheckCircle, ShieldCheck } from 'lucide-react';
import { StoredMessageRecord, apiLogSecurityEvent } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { verifyAndDecryptMessage } from '../crypto/secureMessenger.js';
import { EncryptedMessageEnvelope } from '@securetext/shared';

interface TamperSimulatorModalProps {
  message: StoredMessageRecord | null;
  onClose: () => void;
  onTamperSimulated?: (result: { attackType: string; outcome: string; errorDetails: string }) => void;
}

export const TamperSimulatorModal: React.FC<TamperSimulatorModalProps> = ({
  message,
  onClose,
  onTamperSimulated,
}) => {
  const { clientKeys } = useAuth();
  const [activeAttack, setActiveAttack] = useState<
    'CIPHERTEXT_BIT' | 'AUTH_TAG' | 'AAD_METADATA' | 'FORGED_SIGNATURE' | 'REPLAY_ATTACK'
  >('CIPHERTEXT_BIT');

  const [simulationResult, setSimulationResult] = useState<{
    status: 'IDLE' | 'ATTACK_BLOCKED' | 'ERROR';
    attackLabel: string;
    defenseMechanism: string;
    errorSnippet: string;
    details: string;
  }>({
    status: 'IDLE',
    attackLabel: '',
    defenseMechanism: '',
    errorSnippet: '',
    details: '',
  });

  if (!message || !clientKeys) return null;

  const runTamperSimulation = async () => {
    // Clone original envelope
    const envelope: EncryptedMessageEnvelope = {
      messageId: message.messageId,
      senderId: message.senderId,
      recipientId: message.recipientId,
      protocolVersion: message.protocolVersion,
      senderKeyId: message.senderKeyId,
      recipientKeyId: message.recipientKeyId,
      ephemeralPublicKey: message.ephemeralPublicKey,
      nonce: message.nonce,
      ciphertext: message.ciphertext,
      authTag: message.authTag,
      signature: message.signature,
      canonicalAAD: message.canonicalAAD,
      timestamp: message.timestamp,
      deliveryStatus: message.deliveryStatus,
    };

    let attackLabel = '';
    let defenseMechanism = '';

    try {
      if (activeAttack === 'CIPHERTEXT_BIT') {
        attackLabel = 'Single-Bit Ciphertext Corruption (Adversary modified encrypted bytes)';
        defenseMechanism = 'AES-256-GCM 128-bit Authentication Tag (GHASH) & Ed25519 Envelope Signature';

        // Tamper 1 character in the base64 ciphertext
        const origChar = envelope.ciphertext[0];
        const tamperedChar = origChar === 'A' ? 'B' : 'A';
        envelope.ciphertext = tamperedChar + envelope.ciphertext.substring(1);
      } else if (activeAttack === 'AUTH_TAG') {
        attackLabel = 'Authentication Tag Forgery / Tampering';
        defenseMechanism = 'AES-256-GCM Galois/Counter Mode GHASH Polynomial Verification';

        const origTag = envelope.authTag;
        envelope.authTag = (origTag[0] === 'X' ? 'Y' : 'X') + origTag.substring(1);
      } else if (activeAttack === 'AAD_METADATA') {
        attackLabel = 'Metadata Tampering (Adversary altered sender identity in AAD)';
        defenseMechanism = 'Authenticated Additional Data (AAD) Cryptographic Binding in AES-GCM Tag';

        try {
          const parsed = JSON.parse(envelope.canonicalAAD);
          parsed.senderId = 'mallory_adversary_hijack';
          envelope.canonicalAAD = JSON.stringify(parsed);
        } catch {
          envelope.canonicalAAD = '{"senderId":"attacker_injected"}';
        }
      } else if (activeAttack === 'FORGED_SIGNATURE') {
        attackLabel = 'Signature Counterfeiting (Adversary forged Ed25519 identity signature)';
        defenseMechanism = 'Ed25519 (RFC 8032) Digital Signature Verification against Sender Public Key';

        // Replace signature with random invalid base64 signature
        envelope.signature = 'BOGUS_INVALID_SIGNATURE_BYTES_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
      } else if (activeAttack === 'REPLAY_ATTACK') {
        attackLabel = 'Replay Attack (Adversary re-transmitting previously captured envelope)';
        defenseMechanism = 'Recipient Monotonic Timestamp & Client Replay Protection Cache';

        // First decrypt normally to populate cache
        verifyAndDecryptMessage(clientKeys, message.senderKeyId || clientKeys.signingKeys.publicKey.toString(), envelope, true);
        // Second attempt will trigger replay rejection
        verifyAndDecryptMessage(clientKeys, message.senderKeyId || clientKeys.signingKeys.publicKey.toString(), envelope, false);
      }

      // Now run decryption with the tampered envelope
      verifyAndDecryptMessage(clientKeys, message.senderKeyId || clientKeys.signingKeys.publicKey.toString(), envelope, false);

      // If it reaches here, the security check failed (should never happen)
      setSimulationResult({
        status: 'ERROR',
        attackLabel,
        defenseMechanism,
        errorSnippet: 'CRITICAL FAILURE: Tampered message was erroneously accepted!',
        details: 'Security vulnerability: Ciphertext was accepted without valid authentication.',
      });
    } catch (err: any) {
      // Expected: Security exception caught and blocked!
      console.log(`[Tamper Simulator PASS] Caught expected security failure:`, err.message);

      setSimulationResult({
        status: 'ATTACK_BLOCKED',
        attackLabel,
        defenseMechanism,
        errorSnippet: err.message,
        details: 'The cryptographic layer successfully detected unauthorized modification and halted execution immediately. Zero plaintext was revealed or decrypted.',
      });

      // Log security event to backend
      await apiLogSecurityEvent({
        eventType: activeAttack === 'REPLAY_ATTACK' ? 'REPLAY_PREVENTED' : 'TAMPER_DETECTED',
        status: 'CRITICAL',
        details: `Simulated attack blocked: ${attackLabel}. Catch reason: ${err.message}`,
        metadata: { messageId: message.messageId, attackType: activeAttack },
      });

      if (onTamperSimulated) {
        onTamperSimulated({
          attackType: activeAttack,
          outcome: 'BLOCKED',
          errorDetails: err.message,
        });
      }
    }
  };

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
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                Academic Tamper & Attack Simulator
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Demonstrate live cryptographic integrity verification to your research supervisor
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Attack Vector Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
            Select Simulated Threat Attack Vector:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { id: 'CIPHERTEXT_BIT', name: '1. Bit-Flipping in Ciphertext', desc: 'Adversary modifies 1 bit of encrypted message in cloud storage' },
              { id: 'AUTH_TAG', name: '2. Tag Corruption / Forgery', desc: 'Adversary tampers with the 128-bit GHASH authentication tag' },
              { id: 'AAD_METADATA', name: '3. AAD Identity Hijack', desc: 'Adversary modifies senderId or timestamp metadata in AAD' },
              { id: 'FORGED_SIGNATURE', name: '4. Signature Forgery', desc: 'Adversary submits counterfeit Ed25519 digital signature' },
              { id: 'REPLAY_ATTACK', name: '5. Replay Attack', desc: 'Adversary captures valid envelope and replays it to recipient' },
            ].map((atk) => (
              <label
                key={atk.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: activeAttack === atk.id ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: activeAttack === atk.id ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="attackType"
                  checked={activeAttack === atk.id}
                  onChange={() => setActiveAttack(atk.id as any)}
                  style={{ marginTop: '0.25rem' }}
                />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{atk.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{atk.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Run Simulation Button */}
        <div style={{ marginBottom: '1.25rem' }}>
          <button
            onClick={runTamperSimulation}
            className="btn btn-danger"
            style={{ width: '100%', padding: '0.75rem' }}
          >
            <Bug size={16} /> Execute Live Attack & Test Cryptographic Defense
          </button>
        </div>

        {/* Live Simulation Result Display */}
        {simulationResult.status === 'ATTACK_BLOCKED' && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '0.5rem',
              marginTop: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontWeight: 700, fontSize: '0.875rem' }}>
              <ShieldCheck size={18} /> ATTACK DETECTED AND DEFENDED SUCCESSFULLY
            </div>
            <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.5rem' }}>
              <strong>Attack Vector:</strong> {simulationResult.attackLabel}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.25rem' }}>
              <strong>Defense Mechanism:</strong> {simulationResult.defenseMechanism}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#991b1b', backgroundColor: '#fee2e2', padding: '0.5rem', borderRadius: '0.375rem', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
              {simulationResult.errorSnippet}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#14532d', marginTop: '0.5rem' }}>
              {simulationResult.details}
            </div>
          </div>
        )}

        {simulationResult.status === 'ERROR' && (
          <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #f87171', borderRadius: '0.5rem', marginTop: '1rem', color: '#991b1b' }}>
            <div style={{ fontWeight: 700 }}>{simulationResult.errorSnippet}</div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{simulationResult.details}</div>
          </div>
        )}

        {/* Modal Footer */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
