# Threat Model and Security Assumptions

## 1. System Overview
**SecureText** is a cryptographic secure messaging system designed for research and cloud environments. It protects text messages against passive surveillance, untrusted cloud infrastructure, active network adversaries, and tampering.

## 2. Security Objectives
- **Confidentiality**: Only the intended recipient can read the plaintext of a message. Neither intermediate network nodes nor the cloud database administrators can decrypt the ciphertext.
- **Integrity**: Any modification to the ciphertext, metadata, or authentication tag during transit or at rest in cloud storage must be detected and rejected before plaintext rendering.
- **Authenticity & Non-Repudiation**: The recipient must cryptographically verify that the message originated from the claimed sender's registered identity key via Ed25519 digital signatures.
- **Replay Protection**: An adversary capturing an encrypted envelope cannot successfully replay it to induce duplicate state or actions at the recipient.
- **Forward Secrecy (Ephemeral-Static DH)**: Compromise of a sender's long-term identity keys in the future does not compromise past messages encrypted using discarded ephemeral X25519 keys.

---

## 3. Adversary Model & Trust Assumptions

| Threat Actor | Capabilities | In Scope? | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Passive Network Eavesdropper** | Intercepts all traffic between clients and cloud backend. | Yes | Dual-layer protection: TLS 1.3 transport security + AES-256-GCM payload encryption. |
| **Untrusted Cloud / Honest-but-Curious DB Admin** | Full read access to database, storage disks, backend memory, and logs. | Yes | **Zero-Knowledge Cloud**: Server receives only encrypted envelopes, nonces, tags, and signed AAD. Private keys and plaintext never touch the server. |
| **Active Man-in-the-Middle (MITM)** | Alters packets in transit; attempts public-key substitution. | Yes | Ed25519 cross-signed key bundles + visual 60-digit Safety Number / Fingerprint out-of-band verification. |
| **Data Tampering Adversary** | Modifies ciphertext bytes, flippant bit attacks, alters timestamps or sender ID. | Yes | AES-256-GCM 128-bit authentication tag + AAD binding + Ed25519 envelope signature. Any single-bit alteration causes MAC verification failure. |
| **Replay Adversary** | Re-submits previously captured valid encrypted messages. | Yes | Monotonic message identifiers, cryptographic timestamp freshness window, and recipient-side replay cache. |
| **Full Client Endpoint Compromise** | Malware or physical root access on user's device. | Out of Scope / Residual | Mitigated locally via WebCrypto / encrypted IndexedDB; fundamental theoretical limit of endpoint trust. |

---

## 4. Cryptographic Primitives Selection Justification

1. **Key Agreement — X25519 (RFC 7748)**:
   - High speed, constant-time Montgomery ladder execution resistant to timing side-channel attacks.
   - Immune to small-subgroup attacks and twist attacks that plague traditional finite-field Diffie-Hellman and legacy NIST curves (e.g., P-256).
2. **Key Derivation — HKDF-SHA-256 (RFC 5869)**:
   - Two-step Extract-and-Expand paradigm providing pseudorandom distribution even if the raw Diffie-Hellman output has slight non-uniformities.
   - Domain separation with explicit protocol string, sender ID, recipient ID, and message ID context.
3. **Authenticated Encryption — AES-256-GCM (NIST SP 800-38D)**:
   - AEAD (Authenticated Encryption with Associated Data) mode providing high throughput and parallelizable hardware-accelerated processing.
   - Enforces unique 96-bit CSPRNG nonces per key and 128-bit integrity tag.
4. **Digital Signatures — Ed25519 (RFC 8032)**:
   - Edwards-curve Digital Signature Algorithm providing collision resistance, high signing/verification performance, and resilience against weak PRNG states during signing (deterministic nonce derivation).

---

## 5. Security Boundary & Limitations

1. **Metadata Leakage**:
   - The cloud database intentionally stores routing metadata (sender ID, recipient ID, message size, and upload timestamp) to route and deliver messages. In this research prototype, traffic analysis resistance (e.g., padding to fixed block sizes, onion routing) is left as documented future work.
2. **Key Directory Trust Model**:
   - The initial public key directory is maintained by the backend. While keys are cross-signed by the identity holder, complete resistance to server-side key substitution requires users to perform out-of-band Safety Number verification or implement a verifiable transparency log (e.g., Certificate Transparency / CONIKS).
