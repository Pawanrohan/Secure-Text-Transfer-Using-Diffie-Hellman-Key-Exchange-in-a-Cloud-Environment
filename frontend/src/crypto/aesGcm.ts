import { gcm } from '@noble/ciphers/aes';
import {
  bytesToBase64,
  base64ToBytes,
  utf8ToBytes,
  bytesToUtf8,
  zeroize,
} from './utils.js';

export interface EncryptedPayload {
  nonce: string; // Base64 12 bytes
  ciphertext: string; // Base64
  authTag: string; // Base64 16 bytes
  rawNonce: Uint8Array;
  rawCiphertext: Uint8Array;
  rawAuthTag: Uint8Array;
}

/**
 * Generates a fresh 96-bit (12-byte) cryptographically secure random nonce.
 */
export function generateNonce(): Uint8Array {
  const nonce = new Uint8Array(12);
  crypto.getRandomValues(nonce);
  return nonce;
}

/**
 * Encrypts plaintext using AES-256-GCM with Authenticated Additional Data (AAD).
 */
export function encryptAesGcm(
  key: Uint8Array,
  plaintext: string,
  canonicalAAD: string
): EncryptedPayload {
  if (key.length !== 32) {
    throw new Error('AES-256-GCM key must be exactly 32 bytes (256 bits)');
  }

  const rawNonce = generateNonce();
  const aadBytes = utf8ToBytes(canonicalAAD);
  const plaintextBytes = utf8ToBytes(plaintext);

  const cipher = gcm(key, rawNonce, aadBytes);
  const encryptedCombined = cipher.encrypt(plaintextBytes);

  // The last 16 bytes of encryptedCombined is the authentication tag
  const rawCiphertext = encryptedCombined.slice(0, -16);
  const rawAuthTag = encryptedCombined.slice(-16);

  // Zeroize sensitive plaintext buffer
  zeroize(plaintextBytes);

  return {
    nonce: bytesToBase64(rawNonce),
    ciphertext: bytesToBase64(rawCiphertext),
    authTag: bytesToBase64(rawAuthTag),
    rawNonce,
    rawCiphertext,
    rawAuthTag,
  };
}

/**
 * Decrypts AES-256-GCM ciphertext and validates authentication tag and AAD.
 * Rejects any altered bit without revealing plaintext.
 */
export function decryptAesGcm(
  key: Uint8Array,
  nonceBase64: string,
  ciphertextBase64: string,
  authTagBase64: string,
  canonicalAAD: string
): string {
  if (key.length !== 32) {
    throw new Error('AES-256-GCM key must be exactly 32 bytes (256 bits)');
  }

  try {
    const rawNonce = base64ToBytes(nonceBase64);
    const rawCiphertext = base64ToBytes(ciphertextBase64);
    const rawAuthTag = base64ToBytes(authTagBase64);
    const aadBytes = utf8ToBytes(canonicalAAD);

    if (rawAuthTag.length !== 16) {
      throw new Error('Invalid GCM authentication tag length: must be 16 bytes');
    }

    // Recombine ciphertext and 16-byte tag
    const encryptedCombined = new Uint8Array(rawCiphertext.length + rawAuthTag.length);
    encryptedCombined.set(rawCiphertext, 0);
    encryptedCombined.set(rawAuthTag, rawCiphertext.length);

    const cipher = gcm(key, rawNonce, aadBytes);
    const decryptedBytes = cipher.decrypt(encryptedCombined);

    return bytesToUtf8(decryptedBytes);
  } catch (err: any) {
    throw new Error(`Decryption failed: Message tampering detected or authentication tag mismatch. Details: ${err.message}`);
  }
}
