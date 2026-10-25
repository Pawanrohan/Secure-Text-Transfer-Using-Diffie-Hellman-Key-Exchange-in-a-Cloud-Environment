# 🔐 SecureText — Secure Text Transfer Using Diffie–Hellman Key Exchange in a Cloud Environment

<div align="center">

![SecureText Banner](https://img.shields.io/badge/SecureText-End--to--End%20Encrypted%20Messaging-blueviolet?style=for-the-badge&logo=shield&logoColor=white)

[![Protocol](https://img.shields.io/badge/Protocol-X25519%20%7C%20HKDF--SHA256%20%7C%20AES--256--GCM%20%7C%20Ed25519-blue?style=flat-square)](docs/cryptographic-protocol.md)
[![Zero-Knowledge](https://img.shields.io/badge/Cloud%20Trust-Zero--Knowledge%20Enforced-brightgreen?style=flat-square)](docs/threat-model.md)
[![Tests](https://img.shields.io/badge/Tests-17%2F17%20Passing-success?style=flat-square)](docs/testing.md)
[![Node](https://img.shields.io/badge/Node.js-v24-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**A full-stack, research-oriented, end-to-end encrypted cloud messaging system** built for academic evaluation and IEEE research paper publication. All cryptographic operations happen exclusively on the client — the cloud server sees only ciphertext, never plaintext.

[📖 Architecture](docs/architecture.md) • [🔑 Crypto Protocol](docs/cryptographic-protocol.md) • [🛡️ Threat Model](docs/threat-model.md) • [📡 API Reference](docs/api-reference.md) • [🧪 Testing](docs/testing.md)

</div>

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [System Architecture](#-system-architecture)
3. [Cryptographic Protocol](#-cryptographic-protocol)
4. [Technology Stack](#-technology-stack)
5. [Quick Start](#-quick-start)
6. [Environment Configuration](#-environment-configuration)
7. [Demo Accounts](#-demo-accounts)
8. [Testing](#-testing)
9. [Benchmarks](#-benchmarks)
10. [Repository Structure](#-repository-structure)
11. [Documentation](#-documentation)
12. [Limitations & Future Work](#-limitations--future-work)

---

## 🌐 Overview

**SecureText** implements a provably secure, zero-knowledge cloud messaging protocol. The system architecture enforces that:

- 🔒 **Private keys never leave the browser** — generated and stored in IndexedDB
- ☁️ **Cloud stores only ciphertext** — the server cannot read any message
- 🔄 **Forward Secrecy** — fresh ephemeral X25519 keypair generated per message
- ✍️ **Non-Repudiation** — every message envelope is signed with Ed25519
- 🛡️ **Integrity** — AES-256-GCM authentication tag rejects any 1-bit tampering

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    CLIENT DEVICE A (Sender)                │
│  React UI ──► Ephemeral X25519 KeyGen                      │
│               ──► X25519 DH Agreement                      │
│               ──► HKDF-SHA-256 Key Derivation              │
│               ──► AES-256-GCM Encrypt (Nonce + AAD)        │
│               ──► Ed25519 Sign over Transcript Hash        │
└──────────────────────────┬─────────────────────────────────┘
                           │ Encrypted Envelope (HTTPS)
                           ▼
┌────────────────────────────────────────────────────────────┐
│           ZERO-KNOWLEDGE CLOUD BACKEND + DATABASE          │
│  Node.js / Express ──► Rate Limiting + Helmet Headers      │
│  Public Key Directory (pre-keys + fingerprints)            │
│  Encrypted Message Store ──► Ciphertext ONLY stored        │
└──────────────────────────┬─────────────────────────────────┘
                           │ Encrypted Envelope (HTTPS)
                           ▼
┌────────────────────────────────────────────────────────────┐
│                   CLIENT DEVICE B (Recipient)              │
│  React UI ──► Ed25519 Signature Verification               │
│               ──► X25519 DH Agreement                      │
│               ──► HKDF-SHA-256 Key Reconstruction          │
│               ──► AES-256-GCM Decrypt + Tag Verify         │
│               ──► Plaintext rendered in memory             │
└────────────────────────────────────────────────────────────┘
```

> See [docs/architecture.md](docs/architecture.md) for the full Mermaid diagram and detailed component breakdown.

---

## 🔑 Cryptographic Protocol

The protocol follows a 6-step pipeline — all operations execute in the browser:

| Step | Operation | Standard |
|:----:|:----------|:---------|
| 1 | **Key Generation** — X25519 DH keypair + Ed25519 signing keypair | RFC 7748 / RFC 8032 |
| 2 | **Ephemeral DH** — Fresh `(ek_priv, ek_pub)` per message for Forward Secrecy | RFC 7748 |
| 3 | **Key Derivation** — `HKDF-SHA-256(SS, salt, info)` → 256-bit symmetric key | RFC 5869 |
| 4 | **Authenticated Encryption** — `AES-256-GCM(K_msg, nonce, plaintext, AAD)` | NIST SP 800-38D |
| 5 | **Digital Signature** — `Ed25519-Sign(sk_sig, SHA-256(AAD || nonce || CT || tag))` | RFC 8032 |
| 6 | **Verification & Decryption** — Sig verify → DH → HKDF → AES-GCM decrypt | — |

> **Security Property**: The shared secret `SS = X25519(ek_priv, pk_dh_recipient)` is mathematically equivalent to `X25519(sk_dh_recipient, ek_pub)`, enabling symmetric key reconstruction by the recipient.

See the full mathematical formulation in [docs/cryptographic-protocol.md](docs/cryptographic-protocol.md).

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|:-----------|:--------|
| React 19 + Vite + TypeScript | UI framework & build tool |
| React Router | Client-side routing (10 pages) |
| `@noble/curves` | X25519 key exchange + Ed25519 signatures (audited, zero-dependency) |
| `@noble/ciphers` | AES-256-GCM authenticated encryption |
| `@noble/hashes` | HKDF-SHA-256 key derivation |
| IndexedDB | Secure client-side key storage |

### Backend
| Technology | Purpose |
|:-----------|:--------|
| Node.js v24 + Express + TypeScript | REST API server |
| Zod | Runtime schema validation |
| Helmet + express-rate-limit | Security headers & rate limiting |
| JWT (jsonwebtoken) | Stateless session authentication |
| bcrypt | Password hashing |

### Database (Dual-Adapter)
| Mode | Technology | When to Use |
|:-----|:-----------|:------------|
| **Development** | SQLite (`sql.js`) | Local, zero-config, no setup |
| **Production** | PostgreSQL / Supabase | Cloud deployment |

### Testing & Research
| Tool | Purpose |
|:-----|:--------|
| Vitest | Unit & integration test runner |
| Supertest | HTTP API endpoint testing |
| Custom Microbenchmark Suite | IEEE research latency measurements |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18 (tested on v24.2.0)
- **npm** >= 9

### 1. Clone the Repository

```bash
git clone https://github.com/Pawanrohan/Secure-Text-Transfer-Using-Diffie-Hellman-Key-Exchange-in-a-Cloud-Environment.git
cd "Secure-Text-Transfer-Using-Diffie-Hellman-Key-Exchange-in-a-Cloud-Environment"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings (see [Environment Configuration](#-environment-configuration) below).

### 4. Build All Workspaces

```bash
npm run build
```

This compiles `shared` → `backend` → `frontend` in dependency order.

### 5. Start Development Servers

**Terminal 1 — Backend API** (port 5000):
```bash
npm run dev:backend
```

**Terminal 2 — Frontend UI** (port 5173):
```bash
npm run dev:frontend
```

Open your browser: **[http://localhost:5173](http://localhost:5173)**

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# JWT Auth
JWT_SECRET=your_random_secret_min_32_chars
JWT_EXPIRES_IN=24h

# Database — SQLite (local dev, zero-config)
DB_TYPE=sqlite
SQLITE_DB_PATH=./data/securetext.db

# Database — PostgreSQL (cloud production)
# DB_TYPE=postgres
# DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
MAX_CIPHERTEXT_SIZE_BYTES=1048576

# Auto-seed demo accounts on startup
SEED_DEMO_ACCOUNTS=true
```

> ⚠️ **Never commit your `.env` file** — it is already excluded by `.gitignore`.

---

## 👥 Demo Accounts

Two pre-seeded research accounts are available for demonstration and evaluation:

| Account | Email | Password | Role |
|:--------|:------|:---------|:-----|
| **Alice Johnson** | `alice@securetext.local` | `AlicePass123!` | Sender / Peer A |
| **Bob Martinez** | `bob@securetext.local` | `BobPass123!` | Recipient / Peer B |

You can also register new custom user identities at `/register`.

> Set `SEED_DEMO_ACCOUNTS=true` in your `.env` to auto-create these on first startup.

---

## 🧪 Testing

Run the full automated test suite (17 passing tests):

```bash
npm run test
```

### Test Coverage

#### `crypto.test.ts` — Core Protocol Tests
- ✅ 32-byte independent keypair generation (X25519 + Ed25519)
- ✅ Symmetric DH shared secret: `X25519(sk_A, pk_B) == X25519(sk_B, pk_A)`
- ✅ HKDF-SHA-256 key derivation correctness
- ✅ AES-256-GCM encryption/decryption round-trip
- ✅ Ed25519 envelope signature and verification

#### `security.test.ts` — Adversarial / Attack Tests
- ✅ Single-bit ciphertext corruption → GCM tag rejection
- ✅ Authentication tag forgery rejection
- ✅ Tampered AAD metadata rejection
- ✅ Forged Ed25519 signature rejection
- ✅ Rogue self-signed public key bundle rejection

#### `api.test.ts` — Integration Tests
- ✅ Health check endpoint
- ✅ User registration with bcrypt password hashing
- ✅ Session token verification (`/api/auth/me`)
- ✅ Public key registration with self-signature verification
- ✅ **Zero-Knowledge Policy**: plaintext submission rejected with HTTP 400
- ✅ Encrypted envelope persistence in cloud storage
- ✅ Cloud vault ciphertext inspection

> See [docs/testing.md](docs/testing.md) for detailed test documentation.

---

## 📊 Benchmarks

Run the reproducible research benchmark suite:

```bash
npm run benchmark
```

Results are exported to:
- `benchmarks/results.csv` — raw per-iteration measurements
- `benchmarks/benchmark_report.md` — IEEE-style formatted tables

### Experimental Latency Results

> Hardware: 13th Gen Intel Core i9-13900H

| Payload | X25519 KeyGen | DH Agree | HKDF | AES-GCM Enc | AES-GCM Dec | Ed25519 Sign | Ed25519 Verify | **Total** |
|:--------|:-------------:|:--------:|:----:|:-----------:|:-----------:|:------------:|:--------------:|:---------:|
| 100 B   | 2.46 ms | 2.42 ms | 0.22 ms | 0.22 ms | 0.18 ms | 1.46 ms | 3.76 ms | **10.55 ms** |
| 1 KB    | 2.02 ms | 2.18 ms | 0.12 ms | 0.27 ms | 0.30 ms | 0.86 ms | 3.39 ms | **9.40 ms**  |
| 10 KB   | 2.65 ms | 2.70 ms | 0.14 ms | 0.97 ms | 0.86 ms | 1.30 ms | 3.88 ms | **12.31 ms** |
| 100 KB  | 2.87 ms | 2.60 ms | 0.13 ms | 4.53 ms | 4.64 ms | 1.19 ms | 3.89 ms | **19.68 ms** |

**Key finding**: The dominant cost is Ed25519 verification (~3.4–3.9 ms), not AES-GCM encryption. Total end-to-end crypto overhead is < 20 ms even for 100 KB payloads.

---

## 📁 Repository Structure

```
Secure text project/
├── backend/
│   └── src/
│       ├── controllers/        # Auth, Keys, Messages, Security handlers
│       ├── crypto/             # Key bundle verification
│       ├── database/           # SQLite / PostgreSQL adapters & seeder
│       ├── middleware/         # JWT auth & rate limiter
│       ├── routes/             # REST API route registrations
│       ├── tests/              # Unit, security & integration tests
│       ├── benchmarks/         # Microbenchmark runner
│       └── index.ts            # Express server entry point
├── frontend/
│   └── src/
│       ├── components/         # Sidebar, Header, Modals, Inspectors
│       ├── context/            # Auth & Keyring React context providers
│       ├── crypto/             # Client-side X25519, HKDF, AES-GCM, Ed25519
│       │   └── educational/    # Finite-field DH, RSA, Playfair labs
│       ├── pages/              # 10 responsive application views
│       ├── services/           # REST API client
│       └── styles/             # Cybersecurity-themed CSS
├── shared/
│   ├── index.ts                # Canonical protocol types & envelopes
│   └── package.json
├── database/
│   └── schema.sql              # Dual SQLite / PostgreSQL schema
├── docs/
│   ├── architecture.md         # Full system architecture
│   ├── threat-model.md         # Adversary model & security assumptions
│   ├── cryptographic-protocol.md  # Full mathematical formulas
│   ├── api-reference.md        # REST API specification
│   ├── testing.md              # Test suite documentation
│   ├── demonstration-script.md # Presentation & viva script
│   └── postman_collection.json # Complete Postman API collection
├── benchmarks/
│   ├── results.csv             # Raw trial measurements
│   └── benchmark_report.md     # IEEE-style evaluation findings
├── .env.example                # Environment variable template
├── .gitignore
└── README.md
```

---

## 📚 Documentation

| Document | Description |
|:---------|:------------|
| [Architecture](docs/architecture.md) | Full system design with Mermaid diagrams |
| [Cryptographic Protocol](docs/cryptographic-protocol.md) | Mathematical formulation of the protocol |
| [Threat Model](docs/threat-model.md) | Adversary assumptions & security properties |
| [API Reference](docs/api-reference.md) | Complete REST API specification |
| [Testing Guide](docs/testing.md) | Test suite documentation & how to extend |
| [Demonstration Script](docs/demonstration-script.md) | Presentation & viva Q&A guide |

---

## ⚠️ Limitations & Future Work

| # | Limitation | Proposed Solution |
|:-:|:-----------|:------------------|
| 1 | **Metadata Leakage** — Server records sender ID, recipient ID, message length & timestamp | Fixed-length payload padding + onion routing (Mixnets) |
| 2 | **Key Directory Trust** — Key bundles rely on self-signatures + out-of-band safety numbers | Verifiable transparency log (CONIKS / Certificate Transparency) |
| 3 | **Single Device** — One keypair per user profile | Signal-style Double Ratchet + X3DH multi-device pre-key bundles |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Pawan Rohan**
- GitHub: [@Pawanrohan](https://github.com/Pawanrohan)
- Project: [Secure Text Transfer Using Diffie-Hellman Key Exchange in a Cloud Environment](https://github.com/Pawanrohan/Secure-Text-Transfer-Using-Diffie-Hellman-Key-Exchange-in-a-Cloud-Environment)

---

<div align="center">

**⭐ Star this repository if you find it useful for your research!**

*Built for M.Tech research evaluation and IEEE publication*

</div>