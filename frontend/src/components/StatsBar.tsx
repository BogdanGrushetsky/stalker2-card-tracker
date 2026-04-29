interface Stats {
  ownedUnique: number;
  total: number;
  totalOwned: number;
  complete: number;
  missing: number;
  extras: number;
}

interface Props {
  stats: Stats;
  pct: number;
  target: number;
}

export default function StatsBar({ stats, pct, target }: Props) {
  return (
    <div className="stats-bar">
      <div className="stat-item">
        <div className="stat-label">Унікальних</div>
        <div className="stat-value">{stats.ownedUnique}/{stats.total}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Всього карт</div>
        <div className="stat-value">{stats.totalOwned}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Відсутніх</div>
        <div className="stat-value stat-red">{stats.missing}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Зайвих</div>
        <div className="stat-value stat-extra">{stats.extras}</div>
      </div>
      <div className="progress-container">
        <div className="stat-label">
          Прогрес {target > 1 ? `(${target} кол.)` : ''}
        </div>
        <div className="progress-row">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="progress-pct">{pct}%</span>
        </div>
      </div>
    </div>
  );
}
