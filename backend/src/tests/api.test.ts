import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { ed25519 } from '@noble/curves/ed25519';
import { x25519 } from '@noble/curves/ed25519';
import { seedDemoAccounts } from '../database/seed.js';

describe('Backend REST API & Zero-Knowledge Vault Tests', () => {
  let authToken = '';
  let userId = '';
  let dhPubBase64 = '';
  let sigPubBase64 = '';

  beforeAll(async () => {
    await seedDemoAccounts();

    // Generate valid keys for test user
    const dhPriv = x25519.utils.randomPrivateKey();
    const dhPub = x25519.getPublicKey(dhPriv);
    dhPubBase64 = Buffer.from(dhPub).toString('base64');

    const sigPriv = ed25519.utils.randomPrivateKey();
    const sigPub = ed25519.getPublicKey(sigPriv);
    sigPubBase64 = Buffer.from(sigPub).toString('base64');
  });

  it('GET /api/health returns healthy system status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.zeroKnowledgeCloud).toBe(true);
  });

  it('POST /api/auth/register successfully registers a new user', async () => {
    const testEmail = `testuser_${Date.now()}@securetext.local`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        fullName: 'Test Cryptographer',
        password: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.token).toBeDefined();
    authToken = res.body.token;
    userId = res.body.user.id;
  });

  it('GET /api/auth/me returns authenticated user identity', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(userId);
  });

  it('POST /api/keys/register registers X25519 and Ed25519 public keys with self-signature', async () => {
    const sigPriv = ed25519.utils.randomPrivateKey();
    const sigPub = ed25519.getPublicKey(sigPriv);
    const sPubBase64 = Buffer.from(sigPub).toString('base64');

    const payload = new TextEncoder().encode(`${userId}:${dhPubBase64}:1`);
    const signature = Buffer.from(ed25519.sign(payload, sigPriv)).toString('base64');

    const res = await request(app)
      .post('/api/keys/register')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        keyId: 'key_unit_test_01',
        version: 1,
        dhPublicKey: dhPubBase64,
        signingPublicKey: sPubBase64,
        signature,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.bundle.fingerprint).toBeDefined();
    expect(res.body.bundle.safetyNumber).toBeDefined();
  });

  it('POST /api/messages REJECTS message if plaintext field is submitted (Zero-Knowledge Enforcement)', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        messageId: 'msg_illegal_01',
        recipientId: 'usr_bob_demo_002',
        plaintext: 'I am sending plaintext which violates zero-knowledge policy',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Zero-Knowledge|Plaintext/i);
  });

  it('POST /api/messages stores legitimate encrypted envelope in cloud vault', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        messageId: `msg_${Date.now()}`,
        recipientId: 'usr_bob_demo_002',
        protocolVersion: 'SecureText-v1.0',
        senderKeyId: 'key_unit_test_01',
        recipientKeyId: 'key_bob_01',
        ephemeralPublicKey: Buffer.from(new Uint8Array(32).fill(1)).toString('base64'),
        nonce: Buffer.from(new Uint8Array(12).fill(2)).toString('base64'),
        ciphertext: Buffer.from(new Uint8Array(48).fill(3)).toString('base64'),
        authTag: Buffer.from(new Uint8Array(16).fill(4)).toString('base64'),
        signature: Buffer.from(new Uint8Array(64).fill(5)).toString('base64'),
        canonicalAAD: JSON.stringify({ version: 'SecureText-v1.0', messageId: 'msg_01' }),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('stored_in_cloud');
  });

  it('GET /api/messages/vault returns encrypted cloud storage audit records', async () => {
    const res = await request(app)
      .get('/api/messages/vault')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.vault).toBeDefined();
    expect(res.body.vault.records.length).toBeGreaterThan(0);
  });
});
