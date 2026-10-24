import { describe, it, expect } from 'vitest';
import { x25519, ed25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { hkdf } from '@noble/hashes/hkdf';
import { gcm } from '@noble/ciphers/aes';

describe('Cryptographic Primitives Implementation Tests', () => {
  it('generates 32-byte independent keypairs for X25519 and Ed25519', () => {
    const dhPriv = x25519.utils.randomPrivateKey();
    const dhPub = x25519.getPublicKey(dhPriv);
    expect(dhPriv.length).toBe(32);
    expect(dhPub.length).toBe(32);

    const sigPriv = ed25519.utils.randomPrivateKey();
    const sigPub = ed25519.getPublicKey(sigPriv);
    expect(sigPriv.length).toBe(32);
    expect(sigPub.length).toBe(32);

    // Ensure private keys are mathematically distinct
    expect(dhPriv).not.toEqual(sigPriv);
  });

  it('computes identical matching X25519 Diffie-Hellman shared secret for Alice and Bob', () => {
    // Alice keys
    const alicePriv = x25519.utils.randomPrivateKey();
    const alicePub = x25519.getPublicKey(alicePriv);

    // Bob keys
    const bobPriv = x25519.utils.randomPrivateKey();
    const bobPub = x25519.getPublicKey(bobPriv);

    // Alice calculates shared secret with Bob's public key
    const aliceSS = x25519.getSharedSecret(alicePriv, bobPub);

    // Bob calculates shared secret with Alice's public key
    const bobSS = x25519.getSharedSecret(bobPriv, alicePub);

    expect(aliceSS.length).toBe(32);
    expect(bobSS.length).toBe(32);
    expect(aliceSS).toEqual(bobSS);
  });

  it('derives matching 256-bit symmetric keys using HKDF-SHA-256', () => {
    const sharedSecret = new Uint8Array(32).fill(42);
    const salt = sha256(new Uint8Array([1, 2, 3, 4]));
    const info = new TextEncoder().encode('SecureText-v1-AES-GCM-MessageKey|alice|bob|msg_001');

    const keyAlice = hkdf(sha256, sharedSecret, salt, info, 32);
    const keyBob = hkdf(sha256, sharedSecret, salt, info, 32);

    expect(keyAlice.length).toBe(32);
    expect(keyBob.length).toBe(32);
    expect(keyAlice).toEqual(keyBob);
  });

  it('encrypts and decrypts text using AES-256-GCM with Authenticated Additional Data (AAD)', () => {
    const key = new Uint8Array(32).fill(7);
    const nonce = new Uint8Array(12).fill(3);
    const aad = new TextEncoder().encode('{"version":"SecureText-v1.0","sender":"alice"}');
    const plaintext = 'Classified research message: Diffie-Hellman cloud transfer verified.';
    const plaintextBytes = new TextEncoder().encode(plaintext);

    const cipher = gcm(key, nonce, aad);
    const encryptedCombined = cipher.encrypt(plaintextBytes);

    expect(encryptedCombined.length).toBe(plaintextBytes.length + 16);

    // Decrypt
    const decryptedBytes = cipher.decrypt(encryptedCombined);
    const decryptedText = new TextDecoder().decode(decryptedBytes);

    expect(decryptedText).toBe(plaintext);
  });

  it('signs and verifies message envelope transcript using Ed25519', () => {
    const sigPriv = ed25519.utils.randomPrivateKey();
    const sigPub = ed25519.getPublicKey(sigPriv);

    const transcript = sha256(new TextEncoder().encode('canonical_transcript_data_hash_test'));
    const signature = ed25519.sign(transcript, sigPriv);

    expect(signature.length).toBe(64);
    const isValid = ed25519.verify(signature, transcript, sigPub);
    expect(isValid).toBe(true);
  });
});
