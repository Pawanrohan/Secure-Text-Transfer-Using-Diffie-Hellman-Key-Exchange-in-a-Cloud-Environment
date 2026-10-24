import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';

import authRoutes from './routes/auth.js';
import keyRoutes from './routes/keys.js';
import messageRoutes from './routes/messages.js';
import securityRoutes from './routes/security.js';
import { getDatabase } from './database/db.js';
import { seedDemoAccounts } from './database/seed.js';

export const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Global Rate Limiting: 200 requests per 15-minute window
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded: Too many requests from this IP. Please try again later.' },
});
app.use(limiter);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    system: 'SecureText Diffie-Hellman Cloud Messaging',
    version: '1.0.0',
    cryptoEngines: ['X25519', 'HKDF-SHA-256', 'AES-256-GCM', 'Ed25519'],
    zeroKnowledgeCloud: true,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/keys', keyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/security', securityRoutes);

// Centralized Safe Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Internal Error Catch]', err);
  res.status(err.status || 500).json({
    error: 'An internal server error occurred. Cryptographic materials remain isolated and protected.',
    code: err.code || 'INTERNAL_ERROR',
  });
});

// Initialize database and start server if executed directly
async function startServer() {
  try {
    await getDatabase();
    if (process.env.SEED_DEMO_ACCOUNTS !== 'false') {
      await seedDemoAccounts();
    }

    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`[SecureText Server] Running on http://localhost:${PORT}`);
        console.log(`[Zero-Knowledge] Server strictly stores ciphertext envelopes only.`);
      });
    }
  } catch (err) {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
