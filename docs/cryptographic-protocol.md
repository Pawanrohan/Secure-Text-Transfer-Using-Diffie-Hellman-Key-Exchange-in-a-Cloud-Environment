# Cryptographic Protocol Specification

## 1. Classical Finite-Field Diffie–Hellman (Educational Foundation)

Diffie–Hellman key exchange (Diffie & Hellman, 1976) allows two parties to establish a shared secret over an insecure channel.

### Mathematical Formulation
1. **Public Parameters**:
   - A large prime modulus $p$.
   - A primitive root generator $g \in \{2, \dots, p-1\}$.
2. **Key Generation**:
   - Alice chooses private secret $a \in [2, p-2]$ and computes public value $A = g^a \pmod p$.
   - Bob chooses private secret $b \in [2, p-2]$ and computes public value $B = g^b \pmod p$.
3. **Shared Secret Computation**:
   - Alice computes:
     $$S = B^a \pmod p = (g^b)^a \pmod p = g^{ab} \pmod p$$
   - Bob computes:
     $$S = A^b \pmod p = (g^a)^b \pmod p = g^{ab} \pmod p$$
   - An eavesdropper observing $(p, g, A, B)$ must solve the Discrete Logarithm Problem (DLP) to compute $a$ or $b$, or the Computational Diffie-Hellman (CDH) problem to compute $g^{ab} \pmod p$.

### Educational Example with Small Parameters
- Let $p = 23$, $g = 5$.
- Alice chooses private $a = 6 \implies A = 5^6 \pmod{23} = 15625 \pmod{23} = 8$.
- Bob chooses private $b = 15 \implies B = 5^{15} \pmod{23} = 19$.
- Alice computes $S = 19^6 \pmod{23} = 47045881 \pmod{23} = 2$.
- Bob computes $S = 8^{15} \pmod{23} = 35184372088832 \pmod{23} = 2$.
- Matching shared secret established: $S = 2$.

> **Security Note**: Finite-field DH requires $|p| \ge 2048$ or 3072 bits today to provide adequate security, resulting in heavy computational and bandwidth overhead. SecureText transitions to Montgomery Curve25519 for modern efficiency.

---

## 2. Practical Modern Implementation: Curve25519 (X25519)

SecureText utilizes Montgomery curve **Curve25519** defined over the prime field $\mathbb{F}_{2^{255}-19}$:
$$y^2 = x^3 + 486662x^2 + x$$
Using the Montgomery ladder algorithm, scalar multiplication is computed purely on $x$-coordinates in constant time.

### Protocol Steps:
1. Recipient publishes Identity Agreement Public Key $pk_{dh}^B = sk_{dh}^B \cdot G$ (32 bytes).
2. For each message $m$, the Sender generates an ephemeral keypair:
   $$sk_{eph}^A \leftarrow \text{CSPRNG}(32\text{ bytes}), \quad pk_{eph}^A = sk_{eph}^A \cdot G$$
3. Sender computes Diffie-Hellman shared secret:
   $$SS = \text{X25519}(sk_{eph}^A, pk_{dh}^B)$$
4. Recipient computes the identical shared secret:
   $$SS = \text{X25519}(sk_{dh}^B, pk_{eph}^A)$$
5. Sender securely destroys $sk_{eph}^A$ from volatile memory.

---

## 3. Key Derivation Function: HKDF-SHA-256 (RFC 5869)

Raw Diffie-Hellman secrets may possess mathematical bias or structural characteristics not suitable for direct use as symmetric keys. HKDF-SHA-256 extracts entropy and expands it into an independent pseudorandom symmetric key.

### HKDF Steps:
$$\text{Salt} = \text{SHA-256}(pk_{eph}^A \parallel pk_{dh}^B)$$
$$\text{PRK} = \text{HMAC-SHA-256}(\text{Salt}, SS)$$
$$\text{Info} = \text{"SecureText-v1-AES-GCM-MessageKey"}\parallel \text{senderId} \parallel \text{recipientId} \parallel \text{messageId}$$
$$K_{msg} = \text{HMAC-SHA-256}(\text{PRK}, \text{Info} \parallel 0x01)$$

- Output key: 32 bytes (256 bits).

---

## 4. Authenticated Encryption: AES-256-GCM (NIST SP 800-38D)

### Parameters:
- **Cipher**: AES in Galois/Counter Mode with 256-bit key $K_{msg}$.
- **IV/Nonce**: 96 bits (12 bytes) generated via CSPRNG. Uniqueness is enforced per message key.
- **Tag**: 128 bits (16 bytes) GHASH authentication tag.
- **Authenticated Additional Data (AAD)**: Canonical JSON string encoding message metadata:
  ```json
  {
    "version": "SecureText-v1.0",
    "messageId": "msg_uuid",
    "senderId": "user_alice",
    "recipientId": "user_bob",
    "senderKeyId": "key_alice_01",
    "recipientKeyId": "key_bob_01",
    "ephemeralPublicKey": "<Base64_32_bytes>",
    "timestamp": 1730000000000
  }
  ```

### Encryption:
$$(C, T) = \text{AES-GCM-Encrypt}(K_{msg}, \text{Nonce}, \text{Plaintext}, \text{AAD})$$

### Decryption:
$$P = \text{AES-GCM-Decrypt}(K_{msg}, \text{Nonce}, C, \text{AAD}, T)$$
If $T \ne \text{GHASH}(C, \text{AAD})$, decryption immediately halts and outputs an authentication failure with zero plaintext leakage.

---

## 5. Digital Signatures: Ed25519 (RFC 8032)

To guarantee message sender authentication, integrity of the complete envelope, and non-repudiation:
1. Sender signs the cryptographic transcript hash:
   $$\text{Transcript} = \text{SHA-256}(\text{AAD} \parallel \text{Nonce} \parallel C \parallel T)$$
   $$\sigma = \text{Ed25519-Sign}(sk_{sig}^A, \text{Transcript})$$
2. Recipient verifies:
   $$\text{Result} = \text{Ed25519-Verify}(pk_{sig}^A, \text{Transcript}, \sigma)$$
3. If $\text{Result} \ne \text{VALID}$, the envelope is rejected immediately.
