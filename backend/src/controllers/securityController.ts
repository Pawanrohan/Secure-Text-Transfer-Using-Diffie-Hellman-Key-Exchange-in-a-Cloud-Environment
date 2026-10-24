import { Response } from 'express';
import { z } from 'zod';
import { getDatabase } from '../database/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const logEventSchema = z.object({
  eventType: z.enum([
    'KEY_GENERATED',
    'KEY_REGISTERED',
    'KEY_ROTATED',
    'MESSAGE_SENT',
    'MESSAGE_DECRYPTED',
    'TAMPER_DETECTED',
    'SIGNATURE_INVALID',
    'REPLAY_PREVENTED',
    'LOGIN_ATTEMPT',
    'UNAUTHORIZED_ACCESS',
  ]),
  status: z.enum(['SUCCESS', 'WARNING', 'CRITICAL']),
  details: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

export async function logSecurityEvent(req: AuthenticatedRequest, res: Response) {
  try {
    const parse = logEventSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.errors[0].message });
      return;
    }

    const { eventType, status, details, metadata } = parse.data;
    const userId = req.user?.userId || null;
    const db = await getDatabase();

    const eventId = `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.execute(
      'INSERT INTO security_events (id, user_id, event_type, status, details, metadata) VALUES (?, ?, ?, ?, ?, ?)',
      [eventId, userId, eventType, status, details, metadata ? JSON.stringify(metadata) : null]
    );

    res.status(201).json({ success: true, eventId });
  } catch (err: any) {
    console.error('Log security event error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSecurityEvents(req: AuthenticatedRequest, res: Response) {
  try {
    const db = await getDatabase();
    const rows = await db.query(
      `SELECT e.id, e.user_id, e.event_type, e.status, e.details, e.metadata, e.created_at,
              u.email as user_email
       FROM security_events e
       LEFT JOIN users u ON u.id = e.user_id
       ORDER BY e.created_at DESC LIMIT 100`
    );

    res.json({
      events: rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        userEmail: r.user_email || 'System',
        eventType: r.event_type,
        status: r.status,
        details: r.details,
        metadata: r.metadata ? JSON.parse(r.metadata) : null,
        timestamp: r.created_at,
      })),
    });
  } catch (err: any) {
    console.error('Get security events error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
