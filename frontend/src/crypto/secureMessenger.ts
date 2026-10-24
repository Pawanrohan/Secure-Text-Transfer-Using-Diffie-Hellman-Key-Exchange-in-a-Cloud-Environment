import {
  EncryptedMessageEnvelope,
  DecryptedMessage,
  MessageVerificationDetails,
  CanonicalAAD,
  PROTOCOL_VERSION,
  HKDF_INFO_PREFIX,
} from '@securetext/shared';
import { sha256 } from '@noble/hashes/sha256';
import {
  bytesToBase64,
  base64ToBytes,
  bytesToHex,
  zeroize,
} from './utils.js';
import {
  ClientKeyBundle,
  generateX25519KeyPair,
  computePublicKeyFingerprint,
} from './keyManagement.js';
import { computeX25519SharedSecret } from './dhAgreement.js';
import { deriveMessageKey } from './hkdf.js';
import { encryptAesGcm, decryptAesGcm } from './aesGcm.js';
import {
  signEnvelopeTranscript,
  verifyEnvelopeTranscript,
} from './envelopeSigner.js';

// Recipient replay protection cache: Set of processed message IDs
const processedMessageCache = new Set<string>();

export interface RecipientKeyInfo {
  userId: string;
  keyId: string;
  dhPublicKey: string; // Base64
  signingPublicKey: string; // Base64
}

/**
 * High-level Sender Pipeline:
 * Generates Ephemeral DH Keypair -> X25519 Agreement -> HKDF Key Derivation ->
 * AES-256-GCM AEAD Encryption -> Ed25519 Envelope Signature -> Sanitization.
 */
export function prepareAndEncryptMessage(
  senderBundle: ClientKeyBundle,
  recipient: RecipientKeyInfo,
  plaintext: string,
  overrideMessageId?: string
): EncryptedMessageEnvelope {
  const messageId = overrideMessageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = Date.now();

  // 1. Generate fresh Ephemeral X25519 Keypair (Forward Secrecy property)
  const ephemeralKeys = generateX25519KeyPair();
  const ephemeralPubBase64 = bytesToBase64(ephemeralKeys.publicKey);

  // 2. Decode recipient's X25519 public identity key
  const recipientDhPubBytes = base64ToBytes(recipient.dhPublicKey);

  // 3. Perform Diffie-Hellman Key Agreement: SS = X25519(ek_priv, recipient_dh_pub)
  const sharedSecret = computeX25519SharedSecret(ephemeralKeys.privateKey, recipientDhPubBytes);

  // 4. Compute Salt = SHA-256(ek_pub || recipient_dh_pub)
  const salt = sha256(new Uint8Array([...ephemeralKeys.publicKey, ...recipientDhPubBytes]));

  // 5. Context-specific HKDF Info string
  const infoString = `${HKDF_INFO_PREFIX}|${senderBundle.userId}|${recipient.userId}|${messageId}`;

  // 6. Derive 256-bit AES message key
  const messageKey = deriveMessageKey(sharedSecret, salt, infoString, 32);

  // 7. Compile Canonical AAD
  const aadObject: CanonicalAAD = {
    version: PROTOCOL_VERSION,
    messageId,
    senderId: senderBundle.userId,
    recipientId: recipient.userId,
    senderKeyId: senderBundle.keyId,
    recipientKeyId: recipient.keyId,
    ephemeralPublicKey: ephemeralPubBase64,
    timestamp,
  };
  const canonicalAAD = JSON.stringify(aadObject);

  // 8. Authenticated Encryption with AES-256-GCM
  const { nonce, ciphertext, authTag } = encryptAesGcm(messageKey, plaintext, canonicalAAD);

  // 9. Sign canonical envelope transcript with sender's Ed25519 private key
  const signature = signEnvelopeTranscript(senderBundle.signingKeys.privateKey, {
    canonicalAAD,
    nonce,
    ciphertext,
    authTag,
  });

  // 10. CRITICAL: Zeroize ephemeral private key and derived secrets from memory
  zeroize(ephemeralKeys.privateKey);
  zeroize(sharedSecret);
  zeroize(messageKey);

  return {
    messageId,
    senderId: senderBundle.userId,
    recipientId: recipient.userId,
    protocolVersion: PROTOCOL_VERSION,
    senderKeyId: senderBundle.keyId,
    recipientKeyId: recipient.keyId,
    ephemeralPublicKey: ephemeralPubBase64,
    nonce,
    ciphertext,
    authTag,
    signature,
    canonicalAAD,
    timestamp,
    deliveryStatus: 'sent',
  };
}

/**
 * High-level Recipient Pipeline:
 * Replay Check -> Ed25519 Signature Verification -> X25519 Agreement ->
 * HKDF Key Derivation -> AES-256-GCM AEAD Tag & Decryption Verification.
 */
export function verifyAndDecryptMessage(
  recipientBundle: ClientKeyBundle,
  senderSigningPubKeyBase64: string,
  envelope: EncryptedMessageEnvelope,
  allowReplay = false
): DecryptedMessage {
  // 1. Replay Protection Verification
  if (!allowReplay && processedMessageCache.has(envelope.messageId)) {
    throw new Error(`Replay Attack Prevented: Message ID ${envelope.messageId} was already processed`);
  }

  // 2. Ed25519 Identity Signature Verification
  const senderSigningPubKeyBytes = base64ToBytes(senderSigningPubKeyBase64);
  const signatureValid = verifyEnvelopeTranscript(senderSigningPubKeyBytes, envelope.signature, {
    canonicalAAD: envelope.canonicalAAD,
    nonce: envelope.nonce,
    ciphertext: envelope.ciphertext,
    authTag: envelope.authTag,
  });

  if (!signatureValid) {
    throw new Error('Digital Signature Verification Failed: Envelope was forged, altered, or sender key is invalid');
  }

  // 3. Decode ephemeral public key
  const ephemeralPubBytes = base64ToBytes(envelope.ephemeralPublicKey);

  // 4. Reconstruct Diffie-Hellman Shared Secret: SS = X25519(recipient_dh_priv, ek_pub)
  const sharedSecret = computeX25519SharedSecret(
    recipientBundle.dhKeys.privateKey,
    ephemeralPubBytes
  );

  // 5. Reconstruct Salt = SHA-256(ek_pub || recipient_dh_pub)
  const salt = sha256(new Uint8Array([...ephemeralPubBytes, ...recipientBundle.dhKeys.publicKey]));

  // 6. Context-specific HKDF Info string
  const infoString = `${HKDF_INFO_PREFIX}|${envelope.senderId}|${recipientBundle.userId}|${envelope.messageId}`;

  // 7. Derive matching 256-bit AES message key
  const messageKey = deriveMessageKey(sharedSecret, salt, infoString, 32);

  // 8. Decrypt and verify AES-256-GCM authentication tag and AAD
  const plaintext = decryptAesGcm(
    messageKey,
    envelope.nonce,
    envelope.ciphertext,
    envelope.authTag,
    envelope.canonicalAAD
  );

  // Mark message ID as processed in replay cache
  processedMessageCache.add(envelope.messageId);

  // Cryptographic audit details
  const sharedSecretFingerprint = bytesToHex(sha256(sharedSecret)).substring(0, 16);
  const senderSigningFingerprint = computePublicKeyFingerprint(
    new Uint8Array(0),
    senderSigningPubKeyBytes
  );
  const recipientDHFingerprint = computePublicKeyFingerprint(
    recipientBundle.dhKeys.publicKey,
    new Uint8Array(0)
  );

  // Zeroize sensitive secrets
  zeroize(sharedSecret);
  zeroize(messageKey);

  const verificationDetails: MessageVerificationDetails = {
    protocolVersion: envelope.protocolVersion as any,
    keyAgreementAlgorithm: 'X25519',
    keyDerivationAlgorithm: 'HKDF-SHA-256',
    symmetricAlgorithm: 'AES-256-GCM',
    signatureAlgorithm: 'Ed25519',
    signatureVerified: true,
    tagVerified: true,
    aadVerified: true,
    replayDetected: false,
    sharedSecretFingerprint,
    senderSigningFingerprint,
    recipientDHFingerprint,
  };

  return {
    messageId: envelope.messageId,
    senderId: envelope.senderId,
    recipientId: envelope.recipientId,
    plaintext,
    timestamp: envelope.timestamp,
    verificationDetails,
  };
}
