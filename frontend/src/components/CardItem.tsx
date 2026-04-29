'use client';

import { Card, CardState, CATEGORY_ICONS, RARITY_UA, statusText } from '@/types';

interface Props {
  card: Card;
  target: number;
  state: CardState;
  onInc: () => void;
  onDec: () => void;
  onRename: () => void;
}

export default function CardItem({ card, target, state, onInc, onDec, onRename }: Props) {
  return (
    <div className={`card rarity-${card.rarity} state-${state}`}>
      <div className="card-inner">
        <div className="card-top">
          <span className="card-number">#{String(card.number).padStart(2, '0')}</span>
          <span className="card-rarity-badge">{RARITY_UA[card.rarity]}</span>
        </div>

        <div
          className="card-name"
          onClick={onRename}
          title="Клікни щоб перейменувати"
        >
          {card.name}
        </div>

        <div className="card-category">
          {CATEGORY_ICONS[card.category]} {card.category}
        </div>

        <div className="card-controls">
          <button className="btn-count" onClick={onDec} aria-label="Зменшити">−</button>
          <span className="card-count-display">{card.owned}</span>
          <button className="btn-count" onClick={onInc} aria-label="Збільшити">+</button>
        </div>

        <div className="card-status">{statusText(card, target)}</div>
      </div>
    </div>
  );
}
