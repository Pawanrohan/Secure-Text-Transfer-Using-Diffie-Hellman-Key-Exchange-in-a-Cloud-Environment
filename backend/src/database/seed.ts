import bcrypt from 'bcryptjs';
import { getDatabase } from './db.js';

export async function seedDemoAccounts() {
  const db = await getDatabase();

  const existingUsers = await db.query('SELECT id, email FROM users WHERE email IN (?, ?)', [
    'alice@securetext.local',
    'bob@securetext.local',
  ]);

  if (existingUsers.length >= 2) {
    return; // Already seeded
  }

  console.log('[Seed] Seeding default research demo accounts...');

  const aliceId = 'usr_alice_demo_001';
  const bobId = 'usr_bob_demo_002';

  const aliceHash = await bcrypt.hash('AlicePass123!', 10);
  const bobHash = await bcrypt.hash('BobPass123!', 10);

  if (!existingUsers.find((u) => u.email === 'alice@securetext.local')) {
    await db.execute(
      'INSERT INTO users (id, email, full_name, password_hash) VALUES (?, ?, ?, ?)',
      [aliceId, 'alice@securetext.local', 'Alice Johnson', aliceHash]
    );
  }

  if (!existingUsers.find((u) => u.email === 'bob@securetext.local')) {
    await db.execute(
      'INSERT INTO users (id, email, full_name, password_hash) VALUES (?, ?, ?, ?)',
      [bobId, 'bob@securetext.local', 'Bob Martinez', bobHash]
    );
  }

  // Record initial security event
  await db.execute(
    'INSERT INTO security_events (id, user_id, event_type, status, details) VALUES (?, ?, ?, ?, ?)',
    [
      `sec_evt_${Date.now()}_init`,
      aliceId,
      'KEY_REGISTERED',
      'SUCCESS',
      'System initialized with research demo users Alice and Bob.',
    ]
  );

  console.log('[Seed] Seed completed successfully.');
}
