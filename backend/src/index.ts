import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';

// Load .env from workspace or root directory
const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}
dotenv.config(); // fallback default

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import keyRoutes from './routes/keys.js';
import messageRoutes from './routes/messages.js';
import securityRoutes from './routes/security.js';
import { getDatabase } from './database/db.js';
import { seedDemoAccounts } from './database/seed.js';

export const app = express();
export const PORT = Number(process.env.PORT) || 5000;

export let server: http.Server | null = null;
let isStarting = false;

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
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:3000',
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow local development clients
      }
    },
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

// Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    system: 'SecureText Diffie-Hellman Cloud Messaging',
    version: '1.0.0',
    cryptoEngines: ['X25519', 'HKDF-SHA-256', 'AES-256-GCM', 'Ed25519'],
    zeroKnowledgeCloud: true,
    port: PORT,
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

// Start server function with error-trapping and duplicate-protection
export function startServer(port = PORT): Promise<http.Server | null> {
  if (isStarting || (server && server.listening)) {
    return Promise.resolve(server);
  }
  isStarting = true;

  return new Promise(async (resolve, reject) => {
    try {
      await getDatabase();
      if (process.env.SEED_DEMO_ACCOUNTS !== 'false') {
        await seedDemoAccounts();
      }

      if (process.env.NODE_ENV === 'test') {
        isStarting = false;
        return resolve(null);
      }

      const srv = app.listen(port, () => {
        server = srv;
        isStarting = false;
        console.log(`[SecureText Server] Running on http://localhost:${port}`);
        console.log(`[Zero-Knowledge] Server strictly stores ciphertext envelopes only.`);
        resolve(srv);
      });

      srv.on('error', (err: any) => {
        isStarting = false;
        if (err.code === 'EADDRINUSE') {
          console.error(`\n=============================================================`);
          console.error(`[SecureText Startup Error] Port ${port} is already in use.`);
          console.error(`-------------------------------------------------------------`);
          console.error(`A process is currently listening on port ${port}.`);
          console.error(`Options to resolve:`);
          console.error(`1. Terminate the process currently occupying port ${port}.`);
          console.error(`2. Set PORT=<another_port> in your .env (e.g., PORT=5001).`);
          console.error(`=============================================================\n`);
        } else {
          console.error(`[SecureText Startup Error] Listener error:`, err);
        }
        reject(err);
      });
    } catch (err) {
      isStarting = false;
      console.error('Failed to initialize server:', err);
      reject(err);
    }
  });
}

// Graceful termination handling
const handleShutdown = async (signal: string) => {
  console.log(`\n[SecureText Server] Received ${signal}. Shutting down cleanly...`);
  if (server) {
    server.close();
  }
  try {
    const db = await getDatabase();
    await db.close();
  } catch {}
  process.exit(0);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(() => {
    process.exitCode = 1;
  });
}
