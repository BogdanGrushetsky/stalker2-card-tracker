'use client';

import { useState, useRef, useEffect } from 'react';
import * as api from '@/lib/api';

interface Props {
  target: number;
  onClose: () => void;
}

export default function AiAnalysisModal({ target, onClose }: Props) {
  const [text,    setText]    = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        for await (const chunk of api.streamAnalysis(target)) {
          if (cancelled) break;
          setText(prev => prev + chunk);
          requestAnimationFrame(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Помилка підключення до AI');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [target]);

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal ai-modal">

        <div className="parse-modal-header">
          <div className="modal-title">◈ AI — Аналіз колекції · мета ×{target}</div>
          <button className="parse-close" onClick={onClose}>×</button>
        </div>

        {loading && text === '' && (
          <div className="parse-loading">
            <div className="parse-loading-icon">◈</div>
            <div className="parse-loading-text">AI аналізує колекцію…</div>
            <div className="parse-loading-sub">Може зайняти 10–30 секунд</div>
          </div>
        )}

        {error && <div className="parse-error">{error}</div>}

        {text && (
          <div className="ai-analysis-text" ref={scrollRef}>
            {text}
            {loading && <span className="ai-cursor">▌</span>}
          </div>
        )}

        {!loading && (
          <div className="modal-actions">
            <button className="btn-modal-ok" onClick={onClose}>Закрити</button>
          </div>
        )}

      </div>
    </div>
  );
}
