'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, FilterType,
  CATEGORY_ORDER, CATEGORY_ICONS,
  getState, isVisible,
} from '@/types';
import * as api from '@/lib/api';
import { getToken } from '@/lib/auth';
import Header from '@/components/Header';
import StatsBar from '@/components/StatsBar';
import ControlsBar from '@/components/ControlsBar';
import CardItem from '@/components/CardItem';
import RenameModal from '@/components/RenameModal';
import Toast from '@/components/Toast';

export default function Home() {
  const router = useRouter();
  const [cards, setCards]           = useState<Card[]>([]);
  const [target, setTarget]         = useState(1);
  const [filter, setFilter]         = useState<FilterType>('all');
  const [renameCard, setRenameCard] = useState<Card | null>(null);
  const [toast, setToast]           = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const pending    = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }, []);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    const saved = parseInt(localStorage.getItem('targetSets') ?? '1');
    setTarget(isNaN(saved) ? 1 : Math.max(1, Math.min(10, saved)));
    api.fetchCards().then(setCards).catch(() => showToast('Помилка завантаження'));
  }, [router, showToast]);

  const adjustCount = useCallback((id: number, delta: number) => {
    setCards(prev => prev.map(c => {
      if (c.id !== id) return c;
      const owned = Math.max(0, Math.min(99, c.owned + delta));
      clearTimeout(pending.current[id]);
      pending.current[id] = setTimeout(() => api.updateOwned(id, owned), 400);
      return { ...c, owned };
    }));
  }, []);

  const handleRename = useCallback(async (id: number, name: string) => {
    try {
      const updated = await api.updateName(id, name);
      setCards(prev => prev.map(c => (c.id === id ? updated : c)));
      showToast('Назву збережено');
    } catch {
      showToast('Помилка збереження');
    }
  }, [showToast]);

  const handleTargetChange = useCallback((t: number) => {
    const val = Math.max(1, Math.min(10, t));
    setTarget(val);
    localStorage.setItem('targetSets', String(val));
  }, []);

  const copyMissing = useCallback(() => {
    const missing = cards.filter(c => c.owned < target);
    if (!missing.length) { showToast('Відсутніх немає!'); return; }
    const text =
      `S.T.A.L.K.E.R. 2 — відсутні карти (мета: ${target} кол.):\n\n` +
      missing
        .map(c => `#${String(c.number).padStart(2, '0')} ${c.name} — потрібно: ${target - c.owned}`)
        .join('\n');
    navigator.clipboard.writeText(text)
      .then(() => showToast(`Скопійовано ${missing.length} карт`))
      .catch(() => showToast('Помилка копіювання'));
  }, [cards, target, showToast]);

  const stats = {
    ownedUnique: cards.filter(c => c.owned > 0).length,
    total:       cards.length,
    totalOwned:  cards.reduce((s, c) => s + c.owned, 0),
    complete:    cards.filter(c => c.owned >= target).length,
    missing:     cards.filter(c => c.owned < target).length,
    extras:      cards.reduce((s, c) => s + Math.max(0, c.owned - target), 0),
  };
  const pct        = stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;
  const categories = CATEGORY_ORDER.filter(cat => cards.some(c => c.category === cat));
  const noResults  = cards.length > 0 && !cards.some(c => isVisible(c, filter, target));

  return (
    <>
      <Header />
      <StatsBar stats={stats} pct={pct} target={target} />
      <ControlsBar
        target={target}
        filter={filter}
        onTargetChange={handleTargetChange}
        onFilterChange={setFilter}
        onCopyMissing={copyMissing}
      />

      <main className="main-content">
        {cards.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">⚡</div>
            <div className="empty-text">Завантаження…</div>
          </div>
        )}

        {categories.map(cat => {
          const catCards     = cards.filter(c => c.category === cat);
          const visibleCards = catCards.filter(c => isVisible(c, filter, target));
          if (!visibleCards.length) return null;
          const complete = catCards.filter(c => c.owned >= target).length;

          return (
            <section key={cat} className="category-section">
              <div className="category-header">
                <span className="category-icon">{CATEGORY_ICONS[cat]}</span>
                <span className="category-name">{cat}</span>
                <span className="category-count">{complete}/{catCards.length}</span>
              </div>
              <div className="card-grid">
                {visibleCards.map(card => (
                  <CardItem
                    key={card.id}
                    card={card}
                    target={target}
                    state={getState(card, target)}
                    onInc={() => adjustCount(card.id, 1)}
                    onDec={() => adjustCount(card.id, -1)}
                    onRename={() => setRenameCard(card)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {noResults && (
          <div className="empty-state">
            <div className="empty-icon">◈</div>
            <div className="empty-text">Карт не знайдено</div>
          </div>
        )}
      </main>

      {renameCard && (
        <RenameModal
          card={renameCard}
          onConfirm={name => { handleRename(renameCard.id, name); setRenameCard(null); }}
          onCancel={() => setRenameCard(null)}
        />
      )}

      <Toast message={toast} />
    </>
  );
}
