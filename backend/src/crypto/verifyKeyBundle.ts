import { ed25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function base64ToBytes(base64: string): Uint8Array {
  return Uint8Array.from(Buffer.from(base64, 'base64'));
}

export function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

/**
 * Computes a standardized 64-character SHA-256 hex fingerprint formatted in groups of 4:
 * e.g., "ABCD:1234:EF56:..."
 */
export function computeFingerprint(data: Uint8Array | string): string {
  const inputBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hash = sha256(inputBytes);
  const hex = bytesToHex(hash).toUpperCase();
  return hex.match(/.{1,4}/g)?.join(':') || hex;
}

/**
 * Computes a standardized 60-digit safety number representation for out-of-band visual verification.
 */
export function computeSafetyNumber(userAKey: Uint8Array, userBKey: Uint8Array): string {
  // Sort keys lexicographically to ensure both users derive the identical safety number
  const cmp = Buffer.compare(Buffer.from(userAKey), Buffer.from(userBKey));
  const combined = cmp < 0 ? new Uint8Array([...userAKey, ...userBKey]) : new Uint8Array([...userBKey, ...userAKey]);
  const hash = sha256(combined);
  let digits = '';
  for (let i = 0; i < 30; i++) {
    const val = ((hash[i % hash.length] << 8) | hash[(i + 1) % hash.length]) % 100;
    digits += val.toString().padStart(2, '0');
  }
  return digits.match(/.{1,5}/g)?.join(' ') || digits;
}

/**
 * Verifies that the public key registration bundle was signed with the user's Ed25519 signing key.
 * Expected signed payload: UTF8(userId + ":" + dhPublicKey + ":" + version)
 */
export function verifyRegistrationSignature(
  userId: string,
  dhPublicKeyBase64: string,
  version: number,
  signingPublicKeyBase64: string,
  signatureBase64: string
): boolean {
  try {
    const signingKey = base64ToBytes(signingPublicKeyBase64);
    const signature = base64ToBytes(signatureBase64);
    const payload = new TextEncoder().encode(`${userId}:${dhPublicKeyBase64}:${version}`);
    return ed25519.verify(signature, payload, signingKey);
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}
