import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CARDS_DATA } from './cards.data';

export interface Card {
  id: number;
  number: number;
  name: string;
  category: string;
  rarity: string;
  owned: number;
}

@Injectable()
export class CardsService implements OnModuleInit {
  constructor(private db: DatabaseService) {}

  async onModuleInit() {
    await this.seedCards();
  }

  private async seedCards() {
    const rows = await this.db.query<{ c: string }>('SELECT COUNT(*) AS c FROM cards');
    if (parseInt(rows[0].c) > 0) return;

    const placeholders = CARDS_DATA
      .map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`)
      .join(', ');
    const params = CARDS_DATA.flatMap(([num, name, category, rarity]) => [num, name, category, rarity]);
    await this.db.execute(
      `INSERT INTO cards (number, name, category, rarity) VALUES ${placeholders}`,
      params,
    );
  }

  async findAll(userId: number): Promise<Card[]> {
    return this.db.query<Card>(`
      SELECT c.id, c.number, c.name, c.category, c.rarity,
             COALESCE(uc.owned, 0) AS owned
      FROM cards c
      LEFT JOIN user_cards uc ON uc.card_id = c.id AND uc.user_id = $1
      ORDER BY c.number
    `, [userId]);
  }

  async updateOwned(userId: number, cardId: number, owned: number): Promise<Card> {
    if (typeof owned !== 'number' || isNaN(owned)) {
      throw new BadRequestException('owned must be a number');
    }
    const clamped = Math.max(0, Math.min(99, Math.round(owned)));

    const exists = await this.db.query('SELECT id FROM cards WHERE id = $1', [cardId]);
    if (!exists.length) throw new NotFoundException(`Card ${cardId} not found`);

    await this.db.execute(`
      INSERT INTO user_cards (user_id, card_id, owned) VALUES ($1, $2, $3)
      ON CONFLICT (user_id, card_id) DO UPDATE SET owned = EXCLUDED.owned
    `, [userId, cardId, clamped]);

    return this.findById(userId, cardId);
  }

  async updateName(userId: number, cardId: number, name: string): Promise<Card> {
    if (!name || typeof name !== 'string') {
      throw new BadRequestException('name must be a non-empty string');
    }
    const trimmed = name.trim().slice(0, 60);
    if (!trimmed) throw new BadRequestException('name cannot be empty');

    const count = await this.db.execute(
      'UPDATE cards SET name = $1 WHERE id = $2',
      [trimmed, cardId],
    );
    if (count === 0) throw new NotFoundException(`Card ${cardId} not found`);

    return this.findById(userId, cardId);
  }

  private async findById(userId: number, cardId: number): Promise<Card> {
    const rows = await this.db.query<Card>(`
      SELECT c.id, c.number, c.name, c.category, c.rarity,
             COALESCE(uc.owned, 0) AS owned
      FROM cards c
      LEFT JOIN user_cards uc ON uc.card_id = c.id AND uc.user_id = $1
      WHERE c.id = $2
    `, [userId, cardId]);
    return rows[0];
  }
}
