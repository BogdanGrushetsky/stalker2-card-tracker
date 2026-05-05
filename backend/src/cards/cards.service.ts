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

  async parseNotes(text: string): Promise<{ cardNumber: number; owned: number }[]> {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const model     = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

    const allCards = await this.db.query<{ number: number; name: string }>(
      'SELECT number, name FROM cards ORDER BY number',
    );

    const cardList = allCards
      .map(c => `#${String(c.number).padStart(2, '0')} ${c.name}`)
      .join('\n');

    const systemPrompt =
`You are a parser for S.T.A.L.K.E.R. 2 trading card collection tracker.

Complete card list:
${cardList}

Task: Parse the user's text and extract which cards they have and how many.

Rules:
- Match by number (#01, 01, 1) OR by name (fuzzy/partial Ukrainian match OK)
- If quantity not specified, assume 1
- Quantity words: "два"/"дві"=2, "три"=3, "чотири"=4, "п'ять"=5; also "2шт", "x2", "×2", "2 штуки"
- Return ONLY a valid JSON array, no other text
- Format: [{"cardNumber": 1, "owned": 2}, {"cardNumber": 27, "owned": 1}]
- Only include cards clearly mentioned`;

    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: text },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);

    const data    = await res.json() as { message?: { content?: string } };
    const content = data.message?.content ?? '';
    const match   = content.match(/\[[\s\S]*?\]/);
    if (!match) return [];

    const parsed = JSON.parse(match[0]) as { cardNumber: number; owned: number }[];
    const validNumbers = new Set(allCards.map(c => c.number));

    return parsed.filter(e =>
      Number.isInteger(e.cardNumber) &&
      Number.isInteger(e.owned) &&
      e.owned > 0 &&
      validNumbers.has(e.cardNumber),
    );
  }

  async applyParsed(
    userId:  number,
    entries: { cardNumber: number; owned: number }[],
    mode:    'full' | 'merge',
  ): Promise<Card[]> {
    const allCards = await this.db.query<{ id: number; number: number }>(
      'SELECT id, number FROM cards',
    );

    const entryMap = new Map(
      entries.map(e => [e.cardNumber, Math.max(0, Math.min(99, Math.round(e.owned)))]),
    );

    const toUpdate = mode === 'full'
      ? allCards.map(c  => ({ cardId: c.id, owned: entryMap.get(c.number) ?? 0 }))
      : allCards
          .filter(c => entryMap.has(c.number))
          .map(c    => ({ cardId: c.id, owned: entryMap.get(c.number)! }));

    for (const { cardId, owned } of toUpdate) {
      await this.db.execute(
        `INSERT INTO user_cards (user_id, card_id, owned) VALUES ($1, $2, $3)
         ON CONFLICT (user_id, card_id) DO UPDATE SET owned = EXCLUDED.owned`,
        [userId, cardId, owned],
      );
    }

    return this.findAll(userId);
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
