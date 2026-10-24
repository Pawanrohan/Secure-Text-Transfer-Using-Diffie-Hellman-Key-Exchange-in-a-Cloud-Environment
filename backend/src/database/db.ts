import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

export interface DatabaseAdapter {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<void>;
  close(): Promise<void>;
}

class PostgresAdapter implements DatabaseAdapter {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    // Convert ? to $1, $2, ... for PostgreSQL compatibility
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const result = await this.pool.query(pgSql, params);
    return result.rows as T[];
  }

  async execute(sql: string, params: any[] = []): Promise<void> {
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    await this.pool.query(pgSql, params);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

class SqliteWasmAdapter implements DatabaseAdapter {
  private db: SqlJsDatabase;
  private filePath: string;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(db: SqlJsDatabase, filePath: string) {
    this.db = db;
    this.filePath = filePath;
  }

  private persist() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      try {
        const data = this.db.export();
        const buffer = Buffer.from(data);
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.filePath, buffer);
      } catch (err) {
        console.error('Failed to persist SQLite database to disk:', err);
      }
    }, 100);
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    try {
      stmt.bind(params);
      const rows: T[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as T);
      }
      return rows;
    } finally {
      stmt.free();
    }
  }

  async execute(sql: string, params: any[] = []): Promise<void> {
    if (params.length > 0) {
      const stmt = this.db.prepare(sql);
      try {
        stmt.run(params);
      } finally {
        stmt.free();
      }
    } else {
      this.db.exec(sql);
    }
    this.persist();
  }

  async close(): Promise<void> {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    try {
      const data = this.db.export();
      fs.writeFileSync(this.filePath, Buffer.from(data));
      this.db.close();
    } catch {
      // ignore on exit
    }
  }
}

let dbInstance: DatabaseAdapter | null = null;

export async function getDatabase(): Promise<DatabaseAdapter> {
  if (dbInstance) return dbInstance;

  const dbType = process.env.DB_TYPE || (process.env.DATABASE_URL ? 'postgres' : 'sqlite');

  if (dbType === 'postgres' && process.env.DATABASE_URL) {
    console.log('[DB] Connecting to PostgreSQL / Supabase instance...');
    dbInstance = new PostgresAdapter(process.env.DATABASE_URL);
    await initSchema(dbInstance);
    return dbInstance;
  }

  // Default to WASM SQLite for seamless local execution
  const sqlitePath = process.env.SQLITE_DB_PATH || path.resolve(process.cwd(), 'data', 'securetext.db');
  console.log(`[DB] Initializing local persistent SQLite database at: ${sqlitePath}`);

  const SQL = await initSqlJs();
  let db: SqlJsDatabase;

  if (fs.existsSync(sqlitePath)) {
    const fileBuffer = fs.readFileSync(sqlitePath);
    db = new SQL.Database(fileBuffer);
  } else {
    const dir = path.dirname(sqlitePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new SQL.Database();
  }

  dbInstance = new SqliteWasmAdapter(db, sqlitePath);
  await initSchema(dbInstance);
  return dbInstance;
}

async function initSchema(db: DatabaseAdapter) {
  const schemaPath = path.resolve(process.cwd(), '..', 'database', 'schema.sql');
  const fallbackSchemaPath = path.resolve(process.cwd(), 'database', 'schema.sql');
  const activePath = fs.existsSync(schemaPath) ? schemaPath : fallbackSchemaPath;

  if (fs.existsSync(activePath)) {
    const schemaSql = fs.readFileSync(activePath, 'utf-8');
    // Strip single-line comments first
    const cleanSql = schemaSql
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');

    // Split into individual SQL statements
    const statements = cleanSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      try {
        await db.execute(stmt);
      } catch (err: any) {
        // Table or index might already exist
        if (!err.message?.includes('already exists')) {
          console.warn(`[DB Schema Warning] ${err.message}`);
        }
      }
    }
    console.log('[DB] Schema verified and up to date.');
  }
}
