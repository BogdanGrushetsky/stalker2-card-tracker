export interface Card {
  id: number;
  number: number;
  name: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare';
  owned: number;
}

export type CardState = 'missing' | 'partial' | 'complete' | 'extra';
export type FilterType = 'all' | 'missing' | 'complete' | 'extra' | 'rare';

export const CATEGORY_ORDER = [
  'Події', 'Персонажі', 'Угруповання', 'Лабораторії', 'Артефакти',
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  'Події':       '⚡',
  'Персонажі':   '◈',
  'Угруповання': '⚔',
  'Лабораторії': '⚗',
  'Артефакти':   '◆',
};

export const RARITY_UA: Record<string, string> = {
  common:   'звич',
  uncommon: 'рідк',
  rare:     'епік',
};

export function getState(card: Card, target: number): CardState {
  if (card.owned === 0)          return 'missing';
  if (card.owned < target)       return 'partial';
  if (card.owned === target)     return 'complete';
  return 'extra';
}

export function isVisible(card: Card, filter: FilterType, target: number): boolean {
  const state = getState(card, target);
  switch (filter) {
    case 'all':      return true;
    case 'missing':  return state === 'missing' || state === 'partial';
    case 'complete': return state === 'complete' || state === 'extra';
    case 'extra':    return state === 'extra';
    case 'rare':     return card.rarity === 'rare';
    default:         return true;
  }
}

export function statusText(card: Card, target: number): string {
  const state = getState(card, target);
  const need  = target - card.owned;
  const extra = card.owned - target;
  switch (state) {
    case 'missing':  return target > 1 ? `ВІДСУТНЯ (−${target})` : 'ВІДСУТНЯ';
    case 'partial':  return `НЕ ВИСТАЧАЄ ${need}`;
    case 'complete': return '✓ ЗІБРАНО';
    case 'extra':    return `+${extra} ЗАЙВ${extra === 1 ? 'А' : 'ИХ'}`;
  }
}
