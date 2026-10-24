# SecureText Automated Testing Guide

This document details the test suites created for the research prototype, covering unit verification, negative security tests, and REST API integration.

## 1. Running the Automated Test Suite

From the project root:
```bash
npm run test
```
Or inside the backend workspace:
```bash
npm run test --workspace=@securetext/backend
```

---

## 2. Test Suite Breakdown

### A. Cryptographic Primitives Tests (`src/tests/crypto.test.ts`)
- **Key Generation & Independence**:
  - Verifies that X25519 (agreement) and Ed25519 (signing) generate 32-byte private and public keys.
  - Asserts that private keys are mathematically independent and never reused across algorithms.
- **Diffie–Hellman Shared Secret Agreement**:
  - Simulates Alice and Bob generating independent keypairs.
  - Verifies that $\text{X25519}(sk_A, pk_B) == \text{X25519}(sk_B, pk_A)$ without transmission of private secrets.
- **HKDF-SHA-256 Key Derivation**:
  - Verifies that the two-step Extract-and-Expand process deterministically derives identical 256-bit symmetric keys given matching shared secrets and context-specific info strings.
- **AES-256-GCM Authenticated Encryption & Decryption**:
  - Verifies roundtrip encryption and decryption with 96-bit CSPRNG nonces and Authenticated Additional Data (AAD).
- **Ed25519 Digital Signatures**:
  - Verifies envelope transcript signing and verification using 64-byte deterministic signatures.

---

### B. Mandatory Negative Security Tests (`src/tests/security.test.ts`)
- **Single-Bit Ciphertext Corruption**:
  - Adversary flips exactly 1 bit in the ciphertext payload.
  - Decryption immediately throws `aes/gcm: invalid ghash tag`. Plaintext is never revealed.
- **Authentication Tag Modification**:
  - Adversary modifies bytes of the 16-byte GHASH tag.
  - Decryption immediately halts and rejects the corrupted payload.
- **Authenticated Additional Data (AAD) Alteration**:
  - Adversary modifies unencrypted envelope metadata (e.g., changes sender ID from "alice" to "mallory").
  - GCM tag verification detects the metadata discrepancy and halts.
- **Digital Signature Forgery**:
  - Adversary signs an envelope with an unauthorized private key.
  - Recipient verification against the claimed sender's public key returns `false`.
- **Rogue Public Key Substitution**:
  - Attacker attempts to register a public key with an invalid cross-signature.
  - Directory validation detects the forged signature and rejects registration.

---

### C. REST API & Zero-Knowledge Vault Tests (`src/tests/api.test.ts`)
- **Health Check**: Validates system status and cryptographic capabilities.
- **Account Registration & Login**: Verifies `bcryptjs` hashing and JWT issuance.
- **Self-Signed Key Directory Registration**: Tests public key registration and fingerprint generation.
- **Zero-Knowledge Enforcement**: Confirms that submitting a request with a `plaintext` body is rejected with HTTP `400 Bad Request`.
- **Cloud Storage**: Verifies that only encrypted envelopes are persisted in the cloud database.
