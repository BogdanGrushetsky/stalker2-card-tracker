'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { Card, CATEGORY_ICONS, RARITY_UA } from '@/types';
import * as api from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';

function buildTrade(mine: Card[], theirs: Card[], target: number) {
  const iCanGive = mine.filter(mc => {
    const t = theirs.find(tc => tc.id === mc.id);
    return mc.owned > target && t !== undefined && t.owned === 0;
  });
  const iCanGet = theirs.filter(tc => {
    const m = mine.find(mc => mc.id === tc.id);
    return tc.owned > target && m !== undefined && m.owned === 0;
  });
  return { iCanGive, iCanGet };
}

export default function FriendsPage() {
  const router   = useRouter();
  const me       = getUser();
  const [users, setUsers]             = useState<api.UserStats[]>([]);
  const [selected, setSelected]       = useState<api.UserStats | null>(null);
  const [myCards, setMyCards]         = useState<Card[]>([]);
  const [theirCards, setTheirCards]   = useState<Card[]>([]);
  const [comparing, setComparing]     = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [target, setTarget]           = useState(1);
  const [toast, setToast]             = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }, []);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    const saved = parseInt(localStorage.getItem('targetSets') ?? '1');
    setTarget(isNaN(saved) ? 1 : Math.max(1, Math.min(10, saved)));

    Promise.all([api.fetchUsers(), api.fetchCards()])
      .then(([u, c]) => { setUsers(u); setMyCards(c); })
      .catch(() => showToast('Помилка завантаження'));
  }, [router, showToast]);

  const selectUser = useCallback(async (user: api.UserStats) => {
    if (selected?.id === user.id) {
      setSelected(null); setTheirCards([]); setComparing(false); return;
    }
    setLoadingCards(true);
    try {
      const cards = await api.fetchUserCards(user.id);
      setSelected(user); setTheirCards(cards); setComparing(false);
    } catch {
      showToast('Помилка завантаження');
    } finally {
      setLoadingCards(false);
    }
  }, [selected, showToast]);

  const { iCanGive, iCanGet } = (selected && comparing)
    ? buildTrade(myCards, theirCards, target)
    : { iCanGive: [], iCanGet: [] };

  return (
    <>
      <Header />
      <main className="main-content">

        <div className="friends-section-header">
          <span className="friends-section-title">СТАЛКЕРИ</span>
          <span className="friends-count">{users.length} {users.length === 1 ? 'гравець' : 'гравців'}</span>
        </div>

        <div className="friends-list">
          {users.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">◈</div>
              <div className="empty-text">Завантаження…</div>
            </div>
          )}
          {users.map(user => {
            const isMe       = user.id === me?.id;
            const isSelected = selected?.id === user.id;
            const pct        = user.total_cards > 0
              ? Math.round((user.owned_unique / user.total_cards) * 100)
              : 0;
            return (
              <div
                key={user.id}
                className={`friend-card${isSelected ? ' selected' : ''}${isMe ? ' is-me' : ''}`}
                onClick={() => !isMe && selectUser(user)}
                title={isMe ? 'Це ви' : `Переглянути колекцію ${user.display_name}`}
              >
                <div className="friend-card-top">
                  <span className="friend-display-name">{user.display_name}</span>
                  {isMe && <span className="friend-me-badge">ВИ</span>}
                  <span className="friend-pct">{pct}%</span>
                </div>
                <div className="friend-username">@{user.username}</div>
                <div className="friend-stats-row">
                  <span>{user.owned_unique}/{user.total_cards} унікальних</span>
                </div>
                <div className="friend-progress-bar">
                  <div className="friend-progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {selected && !comparing && (
          <div className="friend-collection-panel">
            <div className="fcp-header">
              <span className="fcp-title">Колекція: {selected.display_name}</span>
              <button className="btn-compare" onClick={() => setComparing(true)}>
                ⇄ Порівняти зі мною
              </button>
            </div>

            {loadingCards ? (
              <div className="empty-state"><div className="empty-text">Завантаження…</div></div>
            ) : (
              <div className="mini-card-grid">
                {theirCards.map(card => (
                  <div
                    key={card.id}
                    className={`mini-card rarity-${card.rarity}${card.owned > 0 ? ' has-it' : ''}`}
                    title={`#${String(card.number).padStart(2, '0')} ${card.name} · ${RARITY_UA[card.rarity]} · ${CATEGORY_ICONS[card.category]} ${card.category}`}
                  >
                    <span className="mc-num">#{String(card.number).padStart(2, '0')}</span>
                    <span className="mc-count">{card.owned > 0 ? `×${card.owned}` : '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selected && comparing && (
          <div className="compare-panel">
            <div className="compare-panel-header">
              <span className="compare-panel-title">
                Обмін: Я ↔ {selected.display_name}
              </span>
              <button className="btn-back" onClick={() => setComparing(false)}>← Колекція</button>
            </div>

            {iCanGive.length === 0 && iCanGet.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◈</div>
                <div className="empty-text">Немає карт для обміну при меті ×{target}</div>
              </div>
            ) : (
              <div className="compare-columns">
                <div className="compare-col">
                  <div className="compare-col-title give">
                    Можу дати ({iCanGive.length})
                  </div>
                  {iCanGive.length === 0
                    ? <div className="compare-empty">Нічого дати</div>
                    : iCanGive.map(c => (
                        <div key={c.id} className="compare-row">
                          <span className="cr-num">#{String(c.number).padStart(2, '0')}</span>
                          <span className="cr-name">{c.name}</span>
                          <span className="cr-count give">+{c.owned - target}</span>
                        </div>
                      ))
                  }
                </div>
                <div className="compare-col">
                  <div className="compare-col-title get">
                    Можу отримати ({iCanGet.length})
                  </div>
                  {iCanGet.length === 0
                    ? <div className="compare-empty">Нічого взяти</div>
                    : iCanGet.map(c => (
                        <div key={c.id} className="compare-row">
                          <span className="cr-num">#{String(c.number).padStart(2, '0')}</span>
                          <span className="cr-name">{c.name}</span>
                          <span className="cr-count get">×{c.owned}</span>
                        </div>
                      ))
                  }
                </div>
              </div>
            )}
          </div>
        )}

      </main>
      <Toast message={toast} />
    </>
  );
}
