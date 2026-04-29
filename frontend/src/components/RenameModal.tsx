'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/types';

interface Props {
  card: Card;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export default function RenameModal({ card, onConfirm, onCancel }: Props) {
  const [name, setName] = useState(card.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(card.name);
    const t = setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 50);
    return () => clearTimeout(t);
  }, [card]);

  const confirm = () => {
    const trimmed = name.trim();
    if (trimmed) onConfirm(trimmed);
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="modal">
        <div className="modal-title">
          Перейменувати #{String(card.number).padStart(2, '0')}
        </div>
        <input
          ref={inputRef}
          type="text"
          className="rename-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirm();
            if (e.key === 'Escape') onCancel();
          }}
        />
        <div className="modal-actions">
          <button className="btn-modal-cancel" onClick={onCancel}>Скасувати</button>
          <button className="btn-modal-ok" onClick={confirm}>Зберегти</button>
        </div>
      </div>
    </div>
  );
}
