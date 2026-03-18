import './VolumeFader.css';

interface VolumeFaderProps {
  value: number;
  onChange?: (db: number) => void;
  readonly?: boolean;
}

export const VolumeFader = ({ value, onChange, readonly = false }: VolumeFaderProps) => {
  const label = value === 0 ? '0 dB' : value > 0 ? `+${value.toFixed(1)} dB` : `${value.toFixed(1)} dB`;
  const pct = ((value + 12) / 24) * 100;
  const colorClass = value > 0 ? 'positive' : value < 0 ? 'negative' : 'zero';

  return (
    <div className="volume-fader">
      <div className="volume-header">
        <span className="volume-label">Volume</span>
        <span className={`volume-value volume-value--${colorClass}`}>{label}</span>
      </div>

      <div className="volume-track">
        <div className="volume-center-line" />
        <div
          className={`volume-fill volume-fill--${colorClass}`}
          style={{
            left: value >= 0 ? '50%' : `${pct}%`,
            right: value >= 0 ? `${100 - pct}%` : '50%',
          }}
        />
        {!readonly && (
          <input
            type="range"
            min={-12}
            max={12}
            step={0.5}
            value={value}
            onChange={(e) => onChange?.(parseFloat(e.target.value))}
            className="volume-range-input"
          />
        )}
      </div>

      <div className="volume-scale">
        <span>-12</span>
        <span>0</span>
        <span>+12</span>
      </div>
    </div>
  );
};
