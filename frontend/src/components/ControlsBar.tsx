'use client';

import { FilterType } from '@/types';

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all',      label: 'Всі' },
  { id: 'missing',  label: 'Відсутні' },
  { id: 'complete', label: 'Зібрано' },
  { id: 'extra',    label: 'Зайві' },
  { id: 'rare',     label: 'Рідкісні' },
];

interface Props {
  target: number;
  filter: FilterType;
  onTargetChange: (t: number) => void;
  onFilterChange: (f: FilterType) => void;
  onCopyMissing: () => void;
  onCopyExtras: () => void;
  onParseNotes: () => void;
}

export default function ControlsBar({
  target, filter, onTargetChange, onFilterChange, onCopyMissing, onCopyExtras, onParseNotes,
}: Props) {
  return (
    <div className="controls-bar">
      <div className="target-selector">
        <span className="target-label">МЕТА:</span>
        <button className="btn-target-adj" onClick={() => onTargetChange(target - 1)}>−</button>
        <input
          type="number"
          className="target-input"
          value={target}
          readOnly
          aria-label="Кількість колекцій"
        />
        <button className="btn-target-adj" onClick={() => onTargetChange(target + 1)}>+</button>
        <span className="target-label">КОЛ.</span>
      </div>

      <div className="filter-tabs">
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`filter-btn${filter === f.id ? ' active' : ''}`}
            onClick={() => onFilterChange(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <button className="btn-copy" onClick={onCopyMissing}>
        ⎘ Копіювати відсутні
      </button>
      <button className="btn-copy" onClick={onCopyExtras}>
        ⎘ Копіювати повторки
      </button>
      <button className="btn-copy btn-ai" onClick={onParseNotes}>
        ✦ AI Розпізнати
      </button>
    </div>
  );
}
