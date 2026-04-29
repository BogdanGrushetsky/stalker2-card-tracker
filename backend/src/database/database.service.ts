import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  pool!: Pool;

  async onModuleInit() {
    this.pool = new Pool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME     || 'cards',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
    await this.waitForDB();
    await this.initSchema();
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  private async waitForDB() {
    for (let i = 1; i <= 15; i++) {
      try {
        await this.pool.query('SELECT 1');
        return;
      } catch {
        if (i === 15) throw new Error('PostgreSQL not reachable after 15 retries');
        console.log(`[db] Waiting for PostgreSQL… (${i}/15)`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  private async initSchema() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        username      TEXT UNIQUE NOT NULL,
        display_name  TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at    BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id       SERIAL PRIMARY KEY,
        number   INTEGER UNIQUE NOT NULL,
        name     TEXT NOT NULL,
        category TEXT NOT NULL,
        rarity   TEXT NOT NULL DEFAULT 'common'
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS user_cards (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        card_id INTEGER NOT NULL REFERENCES cards(id),
        owned   INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, card_id)
      )
    `);
  }

  async query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]> {
    const result = await this.pool.query(text, params);
    return result.rows as T[];
  }

  async execute(text: string, params?: unknown[]): Promise<number> {
    const result = await this.pool.query(text, params);
    return result.rowCount ?? 0;
  }

  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
