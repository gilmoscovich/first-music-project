import type { FrequencyBand, BandVerdict } from '../../types';

interface FrequencyPanelProps {
  bands: FrequencyBand[];
  onChange?: (bands: FrequencyBand[]) => void;
  readonly?: boolean;
}

const VERDICTS: { value: BandVerdict; label: string; color: string }[] = [
  { value: 'too_much', label: 'Too Much', color: 'var(--accent-red)' },
  { value: 'just_right', label: 'Just Right', color: 'var(--accent-green)' },
  { value: 'too_little', label: 'Too Little', color: 'var(--accent-amber)' },
];

export const FrequencyPanel = ({ bands, onChange, readonly = false }: FrequencyPanelProps) => {
  const updateBand = (index: number, updates: Partial<FrequencyBand>) => {
    if (!onChange) return;
    const next = bands.map((b, i) => (i === index ? { ...b, ...updates } : b));
    onChange(next);
  };

  return (
    <div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
        Frequency Bands
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {bands.map((band, i) => (
          <div
            key={band.id}
            style={{
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '10px 12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: band.notes || !readonly ? '8px' : 0 }}>
              <div style={{ minWidth: '80px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{band.label}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{band.range}</div>
              </div>

              {/* Verdict toggle */}
              <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                {VERDICTS.map(({ value, label, color }) => {
                  const active = band.verdict === value;
                  return (
                    <button
                      key={value}
                      onClick={() => !readonly && updateBand(i, { verdict: active ? null : value })}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        borderRadius: 'var(--radius)',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: active ? color : 'var(--bg-primary)',
                        color: active ? '#fff' : 'var(--text-muted)',
                        border: `1px solid ${active ? color : 'var(--border)'}`,
                        transition: 'all 0.15s',
                        cursor: readonly ? 'default' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {(!readonly || band.notes) && (
              <input
                type="text"
                placeholder="Notes for this band..."
                value={band.notes}
                readOnly={readonly}
                onChange={(e) => updateBand(i, { notes: e.target.value })}
                style={{
                  width: '100%',
                  fontSize: '12px',
                  padding: '5px 8px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
