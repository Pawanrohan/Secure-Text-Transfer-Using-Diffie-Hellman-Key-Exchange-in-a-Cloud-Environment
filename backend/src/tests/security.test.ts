import { describe, it, expect } from 'vitest';
import { ed25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { gcm } from '@noble/ciphers/aes';
import { verifyRegistrationSignature } from '../crypto/verifyKeyBundle.js';

describe('Mandatory Security Hardening & Tampering Tests', () => {
  it('SECURITY TEST: Rejects message when ciphertext has even a single bit flipped', () => {
    const key = new Uint8Array(32).fill(9);
    const nonce = new Uint8Array(12).fill(1);
    const aad = new TextEncoder().encode('{"messageId":"msg_test_01"}');
    const plaintext = new TextEncoder().encode('Confidential University Project Submission');

    const cipher = gcm(key, nonce, aad);
    const ciphertext = cipher.encrypt(plaintext);

    // Attacker flips 1 bit in ciphertext payload
    const tamperedCiphertext = new Uint8Array(ciphertext);
    tamperedCiphertext[0] ^= 0x01;

    expect(() => {
      cipher.decrypt(tamperedCiphertext);
    }).toThrow(/aes\/gcm: invalid ghash tag/);
  });

  it('SECURITY TEST: Rejects message when authentication tag is modified', () => {
    const key = new Uint8Array(32).fill(9);
    const nonce = new Uint8Array(12).fill(1);
    const aad = new TextEncoder().encode('{"messageId":"msg_test_02"}');
    const plaintext = new TextEncoder().encode('Integrity verified message');

    const cipher = gcm(key, nonce, aad);
    const ciphertext = cipher.encrypt(plaintext);

    // Attacker alters the last byte of the 16-byte authentication tag
    const tamperedTag = new Uint8Array(ciphertext);
    tamperedTag[tamperedTag.length - 1] ^= 0x01;

    expect(() => {
      cipher.decrypt(tamperedTag);
    }).toThrow(/aes\/gcm: invalid ghash tag/);
  });

  it('SECURITY TEST: Rejects message when Authenticated Additional Data (AAD) is altered', () => {
    const key = new Uint8Array(32).fill(9);
    const nonce = new Uint8Array(12).fill(1);
    const originalAad = new TextEncoder().encode('{"sender":"alice","timestamp":1000}');
    const tamperedAad = new TextEncoder().encode('{"sender":"mallory","timestamp":1000}');
    const plaintext = new TextEncoder().encode('Secure message');

    const cipherEncrypt = gcm(key, nonce, originalAad);
    const ciphertext = cipherEncrypt.encrypt(plaintext);

    // Recipient decrypts with tampered AAD metadata
    const cipherDecryptTampered = gcm(key, nonce, tamperedAad);

    expect(() => {
      cipherDecryptTampered.decrypt(ciphertext);
    }).toThrow(/aes\/gcm: invalid ghash tag/);
  });

  it('SECURITY TEST: Rejects invalid or forged Ed25519 digital signatures', () => {
    const validSignerPriv = ed25519.utils.randomPrivateKey();
    const attackerPriv = ed25519.utils.randomPrivateKey();
    const validSignerPub = ed25519.getPublicKey(validSignerPriv);

    const messageHash = sha256(new TextEncoder().encode('Legitimate envelope contents'));

    // Attacker generates forged signature with their own key
    const forgedSignature = ed25519.sign(messageHash, attackerPriv);

    // Recipient verifies against claimed sender's public key
    const isValid = ed25519.verify(forgedSignature, messageHash, validSignerPub);
    expect(isValid).toBe(false);
  });

  it('SECURITY TEST: Rejects public key registration bundle if cross-signature is invalid', () => {
    const aliceSigningPriv = ed25519.utils.randomPrivateKey();
    const aliceSigningPub = Buffer.from(ed25519.getPublicKey(aliceSigningPriv)).toString('base64');
    const fakeDhPublicKey = Buffer.from(new Uint8Array(32).fill(5)).toString('base64');

    // Signature over different payload
    const bogusPayload = new TextEncoder().encode('different_payload');
    const bogusSignature = Buffer.from(ed25519.sign(bogusPayload, aliceSigningPriv)).toString('base64');

    const verified = verifyRegistrationSignature(
      'usr_alice',
      fakeDhPublicKey,
      1,
      aliceSigningPub,
      bogusSignature
    );

    expect(verified).toBe(false);
  });
});
