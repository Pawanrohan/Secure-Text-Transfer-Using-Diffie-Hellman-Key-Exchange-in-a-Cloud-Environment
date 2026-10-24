import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getDatabase } from '../database/db.js';
import { generateToken, AuthenticatedRequest } from '../middleware/auth.js';

const registerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response) {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.errors[0].message });
      return;
    }

    const { email, fullName, password } = parse.data;
    const db = await getDatabase();

    const existing = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = await bcrypt.hash(password, 10);

    await db.execute(
      'INSERT INTO users (id, email, full_name, password_hash) VALUES (?, ?, ?, ?)',
      [userId, email, fullName, passwordHash]
    );

    // Audit log
    await db.execute(
      'INSERT INTO security_events (id, user_id, event_type, status, details) VALUES (?, ?, ?, ?, ?)',
      [`evt_${Date.now()}`, userId, 'LOGIN_ATTEMPT', 'SUCCESS', `User registered: ${email}`]
    );

    const token = generateToken({ userId, email });

    res.status(201).json({
      user: {
        id: userId,
        email,
        fullName,
        createdAt: new Date().toISOString(),
      },
      token,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Invalid email or password format' });
      return;
    }

    const { email, password } = parse.data;
    const db = await getDatabase();

    const rows = await db.query(
      'SELECT id, email, full_name, password_hash, created_at FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      await db.execute(
        'INSERT INTO security_events (id, event_type, status, details) VALUES (?, ?, ?, ?)',
        [`evt_${Date.now()}`, 'LOGIN_ATTEMPT', 'WARNING', `Failed login attempt for email: ${email}`]
      );
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      await db.execute(
        'INSERT INTO security_events (id, user_id, event_type, status, details) VALUES (?, ?, ?, ?, ?)',
        [`evt_${Date.now()}`, user.id, 'LOGIN_ATTEMPT', 'WARNING', `Failed password attempt for user: ${email}`]
      );
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    await db.execute(
      'INSERT INTO security_events (id, user_id, event_type, status, details) VALUES (?, ?, ?, ?, ?)',
      [`evt_${Date.now()}`, user.id, 'LOGIN_ATTEMPT', 'SUCCESS', `Successful login for user: ${email}`]
    );

    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const db = await getDatabase();
    const rows = await db.query('SELECT id, email, full_name, created_at FROM users WHERE id = ?', [
      req.user.userId,
    ]);

    if (rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
