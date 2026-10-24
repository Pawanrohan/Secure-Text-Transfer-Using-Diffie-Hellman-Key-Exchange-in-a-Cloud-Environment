import { Response } from 'express';
import { z } from 'zod';
import { getDatabase } from '../database/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const sendEnvelopeSchema = z.object({
  messageId: z.string().min(1),
  recipientId: z.string().min(1),
  protocolVersion: z.string().default('SecureText-v1.0'),
  senderKeyId: z.string().min(1),
  recipientKeyId: z.string().min(1),
  ephemeralPublicKey: z.string().min(10), // Base64 X25519 ephemeral key
  nonce: z.string().min(8), // Base64 12-byte IV
  ciphertext: z.string().min(1), // Base64 encrypted payload
  authTag: z.string().min(8), // Base64 16-byte GCM tag
  signature: z.string().min(10), // Base64 Ed25519 signature
  canonicalAAD: z.string().min(1), // JSON string containing AAD
});

export async function sendMessage(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Zero-knowledge policy validation: Ensure no plaintext field was submitted
    if ((req.body as any).plaintext !== undefined || (req.body as any).content !== undefined) {
      res.status(400).json({
        error: 'Security Policy Violation: Plaintext message payload detected. The cloud accepts only ciphertext.',
      });
      return;
    }

    const parse = sendEnvelopeSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.errors[0].message });
      return;
    }

    const {
      messageId,
      recipientId,
      protocolVersion,
      senderKeyId,
      recipientKeyId,
      ephemeralPublicKey,
      nonce,
      ciphertext,
      authTag,
      signature,
      canonicalAAD,
    } = parse.data;

    const senderId = req.user.userId;

    if (senderId === recipientId) {
      res.status(400).json({ error: 'Cannot send encrypted message to yourself' });
      return;
    }

    // Payload size check (Max 1MB for research prototype)
    const payloadSizeBytes = Buffer.byteLength(ciphertext, 'base64');
    if (payloadSizeBytes > 1048576) {
      res.status(413).json({ error: 'Payload exceeds maximum allowed ciphertext limit of 1MB' });
      return;
    }

    const db = await getDatabase();

    // Verify recipient exists
    const recipientRows = await db.query('SELECT id FROM users WHERE id = ?', [recipientId]);
    if (recipientRows.length === 0) {
      res.status(404).json({ error: 'Recipient user does not exist' });
      return;
    }

    // Find or create conversation
    let convRows = await db.query(
      `SELECT id FROM conversations
       WHERE (user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?)`,
      [senderId, recipientId, recipientId, senderId]
    );

    let conversationId: string;
    if (convRows.length === 0) {
      conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db.execute(
        'INSERT INTO conversations (id, user_a_id, user_b_id) VALUES (?, ?, ?)',
        [conversationId, senderId, recipientId]
      );
    } else {
      conversationId = convRows[0].id;
      await db.execute('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        conversationId,
      ]);
    }

    // Store encrypted message envelope in zero-knowledge vault
    await db.execute(
      `INSERT INTO messages (
        id, conversation_id, sender_id, recipient_id, protocol_version,
        sender_key_id, recipient_key_id, ephemeral_public_key, nonce,
        ciphertext, auth_tag, signature, canonical_aad, payload_size_bytes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        messageId,
        conversationId,
        senderId,
        recipientId,
        protocolVersion,
        senderKeyId,
        recipientKeyId,
        ephemeralPublicKey,
        nonce,
        ciphertext,
        authTag,
        signature,
        canonicalAAD,
        payloadSizeBytes,
      ]
    );

    // Record initial delivery status
    await db.execute(
      'INSERT INTO message_delivery_status (id, message_id, status) VALUES (?, ?, ?)',
      [`deliv_${Date.now()}`, messageId, 'stored_in_cloud']
    );

    // Audit log
    await db.execute(
      'INSERT INTO security_events (id, user_id, event_type, status, details, metadata) VALUES (?, ?, ?, ?, ?, ?)',
      [
        `sec_${Date.now()}`,
        senderId,
        'MESSAGE_SENT',
        'SUCCESS',
        `Encrypted message stored in cloud vault. Size: ${payloadSizeBytes} bytes. Recipient: ${recipientId}`,
        JSON.stringify({ messageId, recipientId, size: payloadSizeBytes }),
      ]
    );

    res.status(201).json({
      success: true,
      messageId,
      conversationId,
      status: 'stored_in_cloud',
      payloadSizeBytes,
    });
  } catch (err: any) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Internal server error processing encrypted message' });
  }
}

export async function getMessages(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const currentUserId = req.user.userId;
    const { conversationId, participantId } = req.query;
    const db = await getDatabase();

    let sql = `
      SELECT m.id, m.conversation_id, m.sender_id, m.recipient_id, m.protocol_version,
             m.sender_key_id, m.recipient_key_id, m.ephemeral_public_key, m.nonce,
             m.ciphertext, m.auth_tag, m.signature, m.canonical_aad, m.payload_size_bytes,
             m.created_at, d.status as delivery_status,
             s.full_name as sender_name, s.email as sender_email,
             r.full_name as recipient_name, r.email as recipient_email
      FROM messages m
      LEFT JOIN message_delivery_status d ON d.message_id = m.id
      JOIN users s ON s.id = m.sender_id
      JOIN users r ON r.id = m.recipient_id
      WHERE (m.sender_id = ? OR m.recipient_id = ?)
    `;

    const params: any[] = [currentUserId, currentUserId];

    if (conversationId) {
      sql += ' AND m.conversation_id = ?';
      params.push(conversationId);
    } else if (participantId) {
      sql += ' AND ((m.sender_id = ? AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = ?))';
      params.push(currentUserId, participantId, participantId, currentUserId);
    }

    sql += ' ORDER BY m.created_at ASC';

    const rows = await db.query(sql, params);

    res.json({
      messages: rows.map((r) => ({
        messageId: r.id,
        conversationId: r.conversation_id,
        senderId: r.sender_id,
        recipientId: r.recipient_id,
        senderName: r.sender_name,
        senderEmail: r.sender_email,
        recipientName: r.recipient_name,
        recipientEmail: r.recipient_email,
        protocolVersion: r.protocol_version,
        senderKeyId: r.sender_key_id,
        recipientKeyId: r.recipient_key_id,
        ephemeralPublicKey: r.ephemeral_public_key,
        nonce: r.nonce,
        ciphertext: r.ciphertext,
        authTag: r.auth_tag,
        signature: r.signature,
        canonicalAAD: r.canonical_aad,
        payloadSizeBytes: r.payload_size_bytes,
        deliveryStatus: r.delivery_status || 'stored_in_cloud',
        timestamp: new Date(r.created_at).getTime(),
      })),
    });
  } catch (err: any) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Internal server error retrieving messages' });
  }
}

export async function getConversations(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const currentUserId = req.user.userId;
    const db = await getDatabase();

    const convs = await db.query(
      `SELECT c.id, c.user_a_id, c.user_b_id, c.updated_at,
              u.id as participant_id, u.full_name as participant_name, u.email as participant_email,
              k.fingerprint as participant_fingerprint
       FROM conversations c
       JOIN users u ON (u.id = CASE WHEN c.user_a_id = ? THEN c.user_b_id ELSE c.user_a_id END)
       LEFT JOIN user_public_keys k ON k.user_id = u.id AND k.is_revoked = 0
       WHERE c.user_a_id = ? OR c.user_b_id = ?
       ORDER BY c.updated_at DESC`,
      [currentUserId, currentUserId, currentUserId]
    );

    res.json({
      conversations: convs.map((c) => ({
        id: c.id,
        participantId: c.participant_id,
        participantName: c.participant_name,
        participantEmail: c.participant_email,
        participantFingerprint: c.participant_fingerprint || 'Pending Key Registration',
        updatedAt: c.updated_at,
      })),
    });
  } catch (err: any) {
    console.error('Get conversations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCloudVault(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const db = await getDatabase();

    const rows = await db.query(
      `SELECT m.id, m.sender_id, m.recipient_id, m.protocol_version, m.payload_size_bytes,
              m.nonce, m.auth_tag, m.signature, m.created_at, d.status as delivery_status,
              s.email as sender_email, r.email as recipient_email
       FROM messages m
       LEFT JOIN message_delivery_status d ON d.message_id = m.id
       JOIN users s ON s.id = m.sender_id
       JOIN users r ON r.id = m.recipient_id
       ORDER BY m.created_at DESC`
    );

    const totalBytes = rows.reduce((acc, r) => acc + (r.payload_size_bytes || 0), 0);

    res.json({
      vault: {
        totalEncryptedMessages: rows.length,
        totalStorageBytes: totalBytes,
        storageUsageFormatted: `${(totalBytes / 1024).toFixed(2)} KB`,
        records: rows.map((r) => ({
          messageId: r.id,
          senderEmail: r.sender_email,
          recipientEmail: r.recipient_email,
          protocolVersion: r.protocol_version,
          sizeBytes: r.payload_size_bytes,
          noncePreview: r.nonce.substring(0, 8) + '...',
          authTagPreview: r.auth_tag.substring(0, 8) + '...',
          signaturePreview: r.signature.substring(0, 12) + '...',
          deliveryStatus: r.delivery_status || 'stored_in_cloud',
          createdAt: r.created_at,
        })),
      },
    });
  } catch (err: any) {
    console.error('Cloud vault error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateMessageStatus(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['stored_in_cloud', 'delivered', 'read'].includes(status)) {
      res.status(400).json({ error: 'Invalid delivery status' });
      return;
    }

    const db = await getDatabase();
    await db.execute(
      'UPDATE message_delivery_status SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE message_id = ?',
      [status, id]
    );

    res.json({ success: true, messageId: id, status });
  } catch (err: any) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
