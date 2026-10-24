# SecureText REST API Reference

Base URL: `http://localhost:5000/api` (Local) or `https://<cloud-domain>/api` (Cloud)  
Authentication: `Authorization: Bearer <JWT_TOKEN>`  
Zero-Knowledge Invariant: **Plaintext is never accepted, transmitted, or stored at the backend.**

---

## 1. System Health

### `GET /api/health`
Checks server health, active cryptographic algorithms, and zero-knowledge status.

- **Auth Required**: No
- **Response** `200 OK`:
```json
{
  "status": "healthy",
  "system": "SecureText Diffie-Hellman Cloud Messaging",
  "version": "1.0.0",
  "cryptoEngines": ["X25519", "HKDF-SHA-256", "AES-256-GCM", "Ed25519"],
  "zeroKnowledgeCloud": true,
  "timestamp": "2026-10-24T11:45:00.000Z"
}
```

---

## 2. Authentication

### `POST /api/auth/register`
Registers a new user identity and hashes password using `bcryptjs`.

- **Auth Required**: No
- **Request Body**:
```json
{
  "email": "user@example.com",
  "fullName": "Alice Johnson",
  "password": "Password123!"
}
```
- **Response** `201 Created`:
```json
{
  "user": {
    "id": "usr_1730000000_abc12",
    "email": "user@example.com",
    "fullName": "Alice Johnson",
    "createdAt": "2026-10-24T11:45:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5..."
}
```

### `POST /api/auth/login`
Authenticates user and returns JWT bearer token.

- **Auth Required**: No
- **Request Body**:
```json
{
  "email": "alice@securetext.local",
  "password": "AlicePass123!"
}
```
- **Response** `200 OK`: User profile + JWT token.

### `GET /api/auth/me`
Fetches the currently authenticated user profile.

- **Auth Required**: Yes (`Bearer <token>`)
- **Response** `200 OK`: User profile object.

---

## 3. Public Key Directory

### `POST /api/keys/register`
Registers a client's public keys. Requires an Ed25519 signature over `(userId:dhPublicKey:version)` to prevent rogue key substitution.

- **Auth Required**: Yes
- **Request Body**:
```json
{
  "keyId": "key_1730000000",
  "version": 1,
  "dhPublicKey": "<Base64_X25519_32_bytes>",
  "signingPublicKey": "<Base64_Ed25519_32_bytes>",
  "signature": "<Base64_Ed25519_self_signature>"
}
```
- **Response** `201 Created`:
```json
{
  "success": true,
  "bundle": {
    "id": "key_reg_01",
    "userId": "usr_...",
    "keyId": "key_1730000000",
    "version": 1,
    "dhPublicKey": "...",
    "signingPublicKey": "...",
    "fingerprint": "ABCD:1234:...",
    "safetyNumber": "12345 67890 ...",
    "isRevoked": false
  }
}
```

### `GET /api/keys/directory`
Lists all registered users, their verification status, and public-key fingerprints.

- **Auth Required**: Yes
- **Response** `200 OK`: Array of directory entries.

### `POST /api/keys/rotate`
Rotates user's public keys, marking previous versions revoked and logging a security event.

---

## 4. Encrypted Messaging

### `POST /api/messages`
Uploads an encrypted message envelope to the cloud repository.

> **Zero-Knowledge Check**: If `plaintext` or `content` properties are present in the request body, the server immediately rejects the request with HTTP `400 Bad Request`.

- **Auth Required**: Yes
- **Request Body**:
```json
{
  "messageId": "msg_uuid_001",
  "recipientId": "usr_bob_demo_002",
  "protocolVersion": "SecureText-v1.0",
  "senderKeyId": "key_alice_01",
  "recipientKeyId": "key_bob_01",
  "ephemeralPublicKey": "<Base64_32B_X25519>",
  "nonce": "<Base64_12B_IV>",
  "ciphertext": "<Base64_AES_GCM_Ciphertext>",
  "authTag": "<Base64_16B_GHASH_Tag>",
  "signature": "<Base64_64B_Ed25519_Envelope_Sig>",
  "canonicalAAD": "{\"version\":\"SecureText-v1.0\",\"messageId\":\"msg_uuid_001\"...}"
}
```
- **Response** `201 Created`:
```json
{
  "success": true,
  "messageId": "msg_uuid_001",
  "conversationId": "conv_17300000",
  "status": "stored_in_cloud",
  "payloadSizeBytes": 128
}
```

### `GET /api/messages`
Retrieves encrypted envelopes where the authenticated user is either the recipient or sender.

- **Auth Required**: Yes
- **Query Params**: `participantId` (optional), `conversationId` (optional)
- **Response** `200 OK`: Array of message envelope records.

### `GET /api/messages/vault`
Cloud Storage Dashboard query returning metadata of stored ciphertext records for transparent auditing.

---

## 5. Security & Auditing

### `POST /api/security/events`
Logs a client-side or server-side security event (e.g., `TAMPER_DETECTED`, `REPLAY_PREVENTED`, `KEY_ROTATED`).

### `GET /api/security/events`
Retrieves the centralized audit trail.
