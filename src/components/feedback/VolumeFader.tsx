interface VolumeFaderProps {
  value: number;
  onChange?: (db: number) => void;
  readonly?: boolean;
}

export const VolumeFader = ({ value, onChange, readonly = false }: VolumeFaderProps) => {
  const label = value === 0 ? '0 dB' : value > 0 ? `+${value.toFixed(1)} dB` : `${value.toFixed(1)} dB`;
  const pct = ((value + 12) / 24) * 100;
  const color = value > 0 ? 'var(--accent-amber)' : value < 0 ? 'var(--accent-violet)' : 'var(--accent-green)';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Volume</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color, fontFamily: 'monospace' }}>{label}</span>
      </div>

      <div style={{ position: 'relative', height: '8px', background: 'var(--bg-raised)', borderRadius: '4px', border: '1px solid var(--border)' }}>
        {/* Center line */}
        <div style={{
          position: 'absolute', left: '50%', top: '-4px', bottom: '-4px',
          width: '1px', background: 'var(--border-bright)',
        }} />
        {/* Fill */}
        <div style={{
          position: 'absolute',
          left: value >= 0 ? '50%' : `${pct}%`,
          right: value >= 0 ? `${100 - pct}%` : '50%',
          top: 0, bottom: 0,
          background: color,
          borderRadius: '4px',
          transition: 'all 0.05s',
        }} />
        {!readonly && (
          <input
            type="range"
            min={-12}
            max={12}
            step={0.5}
            value={value}
            onChange={(e) => onChange?.(parseFloat(e.target.value))}
            style={{
              position: 'absolute', inset: 0,
              opacity: 0,
              width: '100%',
              cursor: 'pointer',
            }}
          />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: 'var(--text-muted)', fontSize: '10px', fontFamily: 'monospace' }}>
        <span>-12</span>
        <span>0</span>
        <span>+12</span>
      </div>
    </div>
  );
};
