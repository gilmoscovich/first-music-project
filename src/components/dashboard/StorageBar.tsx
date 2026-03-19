import './StorageBar.css';

const LIMIT_BYTES = 5 * 1024 ** 3; // 5 GB — Firebase Spark free tier

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
};

interface StorageBarProps {
  usedBytes: number;
}

export const StorageBar = ({ usedBytes }: StorageBarProps) => {
  const pct = Math.min((usedBytes / LIMIT_BYTES) * 100, 100);
  const colorClass =
    pct >= 90 ? 'storage-bar-fill--red'
    : pct >= 70 ? 'storage-bar-fill--amber'
    : 'storage-bar-fill--green';

  return (
    <div className="storage-bar">
      <div className="storage-bar-labels">
        <span className="storage-bar-label">Storage</span>
        <span className="storage-bar-usage">
          {formatBytes(usedBytes)} / {formatBytes(LIMIT_BYTES)}
          <span className="storage-bar-pct">{pct.toFixed(1)}%</span>
        </span>
      </div>
      <div className="storage-bar-track">
        <div
          className={`storage-bar-fill ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
