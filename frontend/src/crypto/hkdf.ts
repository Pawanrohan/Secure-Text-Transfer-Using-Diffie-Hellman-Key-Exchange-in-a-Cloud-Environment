import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import { utf8ToBytes } from './utils.js';

/**
 * Derives a 256-bit AES message encryption key using HKDF-SHA-256 (RFC 5869).
 *
 * Parameters:
 * - ikm (Input Keying Material): The X25519 shared secret (32 bytes).
 * - salt: Cryptographically bound salt, typically SHA-256(ephemeralPubKey || recipientPubKey).
 * - info: Domain separation context string binding protocol version, sender ID, recipient ID, message ID.
 * - length: 32 bytes (256 bits).
 */
export function deriveMessageKey(
  sharedSecret: Uint8Array,
  salt: Uint8Array,
  infoString: string,
  keyLength = 32
): Uint8Array {
  if (sharedSecret.length !== 32) {
    throw new Error('HKDF Input Keying Material must be exactly 32 bytes');
  }

  const infoBytes = utf8ToBytes(infoString);
  const derivedKey = hkdf(sha256, sharedSecret, salt, infoBytes, keyLength);

  return derivedKey;
}
