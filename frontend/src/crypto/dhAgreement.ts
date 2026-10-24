import { x25519 } from '@noble/curves/ed25519';

/**
 * Computes an X25519 Diffie-Hellman shared secret.
 * Inputs:
 * - privateKey: 32 bytes scalar
 * - peerPublicKey: 32 bytes Curve25519 point
 * Output: 32 bytes shared secret
 */
export function computeX25519SharedSecret(
  privateKey: Uint8Array,
  peerPublicKey: Uint8Array
): Uint8Array {
  if (privateKey.length !== 32) {
    throw new Error('Invalid X25519 private key length: expected 32 bytes');
  }
  if (peerPublicKey.length !== 32) {
    throw new Error('Invalid X25519 peer public key length: expected 32 bytes');
  }

  // Montgomery ladder scalar multiplication
  const sharedSecret = x25519.getSharedSecret(privateKey, peerPublicKey);

  // Validate non-zero output (protect against small-subgroup / low-order points)
  let allZero = true;
  for (let i = 0; i < sharedSecret.length; i++) {
    if (sharedSecret[i] !== 0) {
      allZero = false;
      break;
    }
  }

  if (allZero) {
    throw new Error('Cryptographic failure: Diffie-Hellman produced an all-zero shared secret (weak public key detected)');
  }

  return sharedSecret;
}
