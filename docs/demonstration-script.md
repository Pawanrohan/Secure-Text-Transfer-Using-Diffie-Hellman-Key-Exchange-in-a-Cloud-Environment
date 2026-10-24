# M.Tech Viva Demonstration Script: SecureText

Use this step-by-step presentation walkthrough to present your project to your university supervisor and evaluation committee.

---

## 1. Opening & Research Motivation (1-2 minutes)
- **Problem Statement**: Traditional cloud messaging systems often rely solely on transport-layer security (TLS). In that model, the cloud provider or database administrator possesses unencrypted plaintext in memory and on disk.
- **Objective**: Develop **SecureText**, an end-to-end encrypted text transfer system that couples modern Montgomery Curve25519 (X25519) Diffie–Hellman key exchange, HKDF-SHA-256 key derivation, AES-256-GCM AEAD encryption, and Ed25519 digital signatures in a zero-knowledge cloud environment.

---

## 2. Live Demonstration Flow (6-8 minutes)

### Step 1: Start Applications & Open Dashboard
- Start backend: `npm run dev:backend` (port 5000).
- Start frontend: `npm run dev:frontend` (port 5173).
- Open browser at `http://localhost:5173`.

### Step 2: Login as Alice Johnson
- On the Login screen, click **"Alice Demo"** (autofills `alice@securetext.local` and `AlicePass123!`).
- Click **"Log In & Decrypt Local Vault"**.
- Explain: *"When Alice logs in, the browser checks her client-side keyring in sandboxed storage. If keys do not exist, the browser generates an X25519 identity keypair and an independent Ed25519 signing keypair, and self-signs the public registration bundle before uploading to the server."*

### Step 3: Inspect Security Center & Safety Numbers
- Navigate to **"Security Center"** on the sidebar.
- Show the **Active Identity Keys** card (X25519, Ed25519, and SHA-256 public key fingerprint).
- Show the **60-digit Safety Number**: Explain that this enables out-of-band verification between Alice and Bob to prevent Man-in-the-Middle (MITM) key substitution attacks.

### Step 4: Dispatch an End-to-End Encrypted Message
- Navigate to **"Messaging"** or click **"Compose Secure Text"**.
- Select **Bob Martinez** as the recipient.
- Enter message: `"Confidential Research Evaluation Data: Protocol v1.0 operational."`
- Click **"Encrypt & Transmit to Cloud"**.
- Explain the 4-stage client pipeline:
  1. Browser generates a fresh ephemeral X25519 keypair $(ek_{priv}, ek_{pub})$ for forward secrecy.
  2. Computes shared secret $SS = \text{X25519}(ek_{priv}, pk_{dh}^{Bob})$.
  3. Derives symmetric key $K_{msg}$ via HKDF-SHA-256.
  4. Encrypts with AES-256-GCM using unique 96-bit CSPRNG nonce and canonical AAD.
  5. Signs the envelope transcript with Alice's Ed25519 private key.
  6. Ephemeral private key and intermediate secrets are zeroized immediately.

### Step 5: Deep Cryptographic Inspection
- In the conversation view, click **"Inspect"** on the newly sent message.
- Show the supervisor the exact parameters in the **Cryptographic Envelope Inspector**:
  - Ephemeral Public Key (32 bytes Base64).
  - Initialization Vector / Nonce (96 bits).
  - AES-GCM GHASH Authentication Tag (128 bits).
  - Ed25519 Signature (64 bytes).
  - Canonical Authenticated Additional Data (AAD JSON).

### Step 6: Live Tamper & Attack Simulation (Crucial for Evaluation!)
- Click **"Tamper Test"** on a message bubble.
- In the **Academic Tamper & Attack Simulator**:
  - Select **"1. Bit-Flipping in Ciphertext"** and click **"Execute Live Attack"**.
  - Show the result: The message is rejected immediately with an authentication tag mismatch (`aes/gcm: invalid ghash tag`), proving that zero altered plaintext is revealed.
  - Select **"3. AAD Identity Hijack"**: Show how modifying metadata in AAD causes cryptographic failure.
  - Select **"4. Signature Forgery"**: Show that an altered Ed25519 signature is rejected before decryption.
  - Select **"5. Replay Attack"**: Show that duplicate message submissions are blocked by the recipient replay protection cache.

### Step 7: Zero-Knowledge Cloud Storage Verification
- Navigate to **"Cloud Storage Vault"**.
- Show the supervisor the database view:
  - Explain: *"Notice that the cloud server and database only hold ciphertext, nonces, tags, and signed envelopes. There is no plaintext column in the schema."*

### Step 8: Educational Cryptography Lab
- Navigate to **"Educational Crypto Lab"**:
  - **Tab 1 (Finite-Field DH)**: Show the classical modular exponentiation calculator ($p, g, a, b, A, B, S$) with the step-by-step mathematical output.
  - **Tab 2 (RSA Basis)**: Review the mathematical demonstration of $(p, q, n, e, d)$ and explain why RSA requires 3072-bit keys and lacks inherent forward secrecy compared to Curve25519.
  - **Tab 3 (Playfair Cipher)**: Show the 5×5 matrix demonstration and explain its historical significance vs. modern vulnerability to frequency cryptanalysis.

### Step 9: Research Benchmarks (Paper Deliverable)
- Navigate to **"Research Evaluation"**:
  - Show **Table I** (latency across 100B, 1KB, 10KB, 100KB payloads).
  - Show **Table II** (ciphertext envelope expansion ratios).
  - Show **Table III** (comparative analysis: TLS-only vs Pre-shared AES vs Proposed DH System vs Playfair).
  - Click **"Run Live In-Browser Benchmark"** to execute real-time trials on the committee's browser!
  - Click **"Export CSV"** to demonstrate reproducible research data export.

---

## 3. Anticipated Viva Questions & Defense Answers

- **Q: Why did you use Curve25519 instead of classical Diffie–Hellman (MODP)?**
  - *Answer*: Classical finite-field DH requires 2048 to 3072-bit primes for 128-bit security, resulting in heavy exponentiation overhead. Curve25519 provides 128-bit security with compact 32-byte keys, constant-time Montgomery ladder execution resistant to timing side channels, and complete immunity to twist/subgroup attacks.
- **Q: How does your system achieve forward secrecy?**
  - *Answer*: For every outgoing message, an ephemeral X25519 keypair is generated. Once the Diffie-Hellman shared secret is computed, the ephemeral private key is immediately zeroized in memory. Even if Alice's identity key is compromised in the future, past message keys cannot be recovered.
- **Q: Why is AES-GCM alone insufficient for sender authentication?**
  - *Answer*: AES-GCM provides authenticated encryption, but the symmetric key is shared between sender and receiver. Either party could technically forge a ciphertext under that key. To provide true non-repudiation and bind the message to the sender's human identity, Ed25519 digital signatures are applied over the canonical transcript.
- **Q: How do you prevent public-key substitution by an untrusted cloud server?**
  - *Answer*: Two layers: 1) Public keys are cross-signed upon registration using the holder's Ed25519 key. 2) Users can verify each other's 60-digit numerical safety numbers out-of-band.
