import { ed25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import {
  bytesToBase64,
  base64ToBytes,
  utf8ToBytes,
} from './utils.js';

export interface EnvelopeTranscriptData {
  canonicalAAD: string;
  nonce: string;
  ciphertext: string;
  authTag: string;
}

/**
 * Computes canonical transcript digest over the encrypted envelope metadata and payload:
 * TranscriptDigest = SHA-256(canonicalAAD || nonce || ciphertext || authTag)
 */
export function computeTranscriptDigest(data: EnvelopeTranscriptData): Uint8Array {
  const combined = utf8ToBytes(`${data.canonicalAAD}|${data.nonce}|${data.ciphertext}|${data.authTag}`);
  return sha256(combined);
}

/**
 * Signs the canonical message envelope with the sender's Ed25519 private key.
 */
export function signEnvelopeTranscript(
  signingPrivateKey: Uint8Array,
  transcriptData: EnvelopeTranscriptData
): string {
  if (signingPrivateKey.length !== 32) {
    throw new Error('Ed25519 signing private key must be exactly 32 bytes');
  }

  const digest = computeTranscriptDigest(transcriptData);
  const signature = ed25519.sign(digest, signingPrivateKey);
  return bytesToBase64(signature);
}

/**
 * Cryptographically verifies that the envelope was signed by the holder of the Ed25519 public key.
 */
export function verifyEnvelopeTranscript(
  signingPublicKey: Uint8Array,
  signatureBase64: string,
  transcriptData: EnvelopeTranscriptData
): boolean {
  if (signingPublicKey.length !== 32) {
    throw new Error('Ed25519 signing public key must be exactly 32 bytes');
  }

  try {
    const signatureBytes = base64ToBytes(signatureBase64);
    const digest = computeTranscriptDigest(transcriptData);
    return ed25519.verify(signatureBytes, digest, signingPublicKey);
  } catch (err) {
    console.warn('Ed25519 signature verification error:', err);
    return false;
  }
}
