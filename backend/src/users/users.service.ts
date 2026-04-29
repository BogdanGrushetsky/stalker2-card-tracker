import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface User {
  id: number;
  username: string;
  display_name: string;
  password_hash: string;
  created_at: number;
}

export interface UserStats {
  id: number;
  username: string;
  display_name: string;
  owned_unique: number;
  total_cards: number;
}

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  async findByUsername(username: string): Promise<User | undefined> {
    const rows = await this.db.query<User>(
      'SELECT * FROM users WHERE username = $1',
      [username],
    );
    return rows[0];
  }

  async findById(id: number): Promise<User | undefined> {
    const rows = await this.db.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id],
    );
    return rows[0];
  }

  async create(username: string, passwordHash: string, displayName: string): Promise<User> {
    const rows = await this.db.query<User>(
      'INSERT INTO users (username, password_hash, display_name) VALUES ($1, $2, $3) RETURNING *',
      [username, passwordHash, displayName],
    );
    return rows[0];
  }

  async findAllWithStats(): Promise<UserStats[]> {
    return this.db.query<UserStats>(`
      SELECT u.id, u.username, u.display_name,
        COALESCE(SUM(CASE WHEN uc.owned > 0 THEN 1 ELSE 0 END), 0)::int AS owned_unique,
        (SELECT COUNT(*)::int FROM cards) AS total_cards
      FROM users u
      LEFT JOIN user_cards uc ON uc.user_id = u.id
      GROUP BY u.id
      ORDER BY u.display_name
    `);
  }
}
