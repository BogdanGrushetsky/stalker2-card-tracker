'use client';

import { useState } from 'react';
import { Card } from '@/types';
import * as api from '@/lib/api';

type Mode = 'merge' | 'full';
type Step = 'input' | 'loading' | 'preview';

interface ParsedEntry { cardNumber: number; owned: number; }
interface PreviewRow  { card: Card; newOwned: number; }

interface Props {
  cards:     Card[];
  onApplied: (updated: Card[]) => void;
  onClose:   () => void;
}

export default function ParseNotesModal({ cards, onApplied, onClose }: Props) {
  const [step,     setStep]     = useState<Step>('input');
  const [text,     setText]     = useState('');
  const [mode,     setMode]     = useState<Mode>('merge');
  const [parsed,   setParsed]   = useState<ParsedEntry[]>([]);
  const [error,    setError]    = useState('');
  const [applying, setApplying] = useState(false);

  const cardMap = new Map(cards.map(c => [c.number, c]));

  const previewRows: PreviewRow[] = (() => {
    if (step !== 'preview') return [];
    const entryMap = new Map(parsed.map(e => [e.cardNumber, e.owned]));
    if (mode === 'merge') {
      return cards
        .filter(c => entryMap.has(c.number) && entryMap.get(c.number) !== c.owned)
        .map(c => ({ card: c, newOwned: entryMap.get(c.number)! }));
    }
    return cards
      .map(c => ({ card: c, newOwned: entryMap.get(c.number) ?? 0 }))
      .filter(r => r.newOwned !== r.card.owned);
  })();

  const handleParse = async () => {
    if (!text.trim()) return;
    setStep('loading');
    setError('');
    try {
      const entries = await api.parseNotes(text);
      if (!entries.length || !entries.some(e => cardMap.has(e.cardNumber))) {
        setError('Не вдалося розпізнати жодної картки. Спробуйте написати інакше або вкажіть номери (#01, #12…).');
        setStep('input');
        return;
      }
      setParsed(entries);
      setStep('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка підключення до AI');
      setStep('input');
    }
  };

  const handleApply = async () => {
    setApplying(true);
    setError('');
    try {
      const updated = await api.applyParsed(parsed, mode);
      onApplied(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка збереження');
      setApplying(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal parse-modal">

        {step === 'input' && <>
          <div className="parse-modal-header">
            <div className="modal-title">✦ AI — Розпізнати колекцію</div>
            <button className="parse-close" onClick={onClose}>×</button>
          </div>

          <div className="parse-modes">
            <label className={`parse-mode${mode === 'merge' ? ' active' : ''}`}>
              <input type="radio" name="parse-mode" value="merge"
                checked={mode === 'merge'} onChange={() => setMode('merge')} />
              <span className="pm-title">Нові картки</span>
              <span className="pm-desc">Тільки вказані картки оновляться. Решта без змін.</span>
            </label>
            <label className={`parse-mode${mode === 'full' ? ' active' : ''}`}>
              <input type="radio" name="parse-mode" value="full"
                checked={mode === 'full'} onChange={() => setMode('full')} />
              <span className="pm-title">Повна колекція</span>
              <span className="pm-desc">Повністю замінює колекцію. Карти яких немає в тексті — обнуляться.</span>
            </label>
          </div>

          <textarea
            className="parse-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={7}
            placeholder={'Вставте список карт тут…\n\nПриклад:\n#01 x2, Скіф 1, Моноліт\n#32 три штуки, є далін та шрам'}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleParse(); }}
          />

          {error && <div className="parse-error">{error}</div>}

          <div className="modal-actions">
            <button className="btn-modal-cancel" onClick={onClose}>Скасувати</button>
            <button className="btn-modal-ok" onClick={handleParse} disabled={!text.trim()}>
              ✦ Розпізнати
            </button>
          </div>
        </>}

        {step === 'loading' && (
          <div className="parse-loading">
            <div className="parse-loading-icon">◈</div>
            <div className="parse-loading-text">AI розпізнає картки…</div>
            <div className="parse-loading-sub">Може зайняти 10–30 секунд</div>
          </div>
        )}

        {step === 'preview' && <>
          <div className="parse-modal-header">
            <div className="modal-title">Перевірте зміни</div>
            <button className="parse-close" onClick={onClose}>×</button>
          </div>

          {previewRows.length === 0
            ? <div className="parse-no-changes">Змін немає — колекція вже відповідає тексту.</div>
            : <div className="parse-preview-list">
                {previewRows.map(({ card, newOwned }) => {
                  const cls = newOwned === 0 ? 'zeroed' : newOwned > card.owned ? 'increase' : 'decrease';
                  return (
                    <div key={card.id} className={`parse-row ${cls}`}>
                      <span className="pr-num">#{String(card.number).padStart(2, '0')}</span>
                      <span className="pr-name">{card.name}</span>
                      <span className="pr-change">
                        <span className="pr-old">×{card.owned}</span>
                        <span className="pr-arrow"> → </span>
                        <span className="pr-new">×{newOwned}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
          }

          {error && <div className="parse-error">{error}</div>}

          <div className="modal-actions">
            <button className="btn-modal-cancel" onClick={() => { setStep('input'); setError(''); }}>
              ← Назад
            </button>
            <button className="btn-modal-ok" onClick={handleApply}
              disabled={applying || previewRows.length === 0}>
              {applying ? '…' : `Застосувати (${previewRows.length})`}
            </button>
          </div>
        </>}

      </div>
    </div>
  );
}
