import type { FrequencyBand, BandVerdict } from '../../types';
import './FrequencyPanel.css';

interface FrequencyPanelProps {
  bands: FrequencyBand[];
  onChange?: (bands: FrequencyBand[]) => void;
  readonly?: boolean;
}

const VERDICTS: { value: BandVerdict; label: string }[] = [
  { value: 'too_much', label: 'Too Much' },
  { value: 'just_right', label: 'Just Right' },
  { value: 'too_little', label: 'Too Little' },
];

export const FrequencyPanel = ({ bands, onChange, readonly = false }: FrequencyPanelProps) => {
  const updateBand = (index: number, updates: Partial<FrequencyBand>) => {
    if (!onChange) return;
    const next = bands.map((b, i) => (i === index ? { ...b, ...updates } : b));
    onChange(next);
  };

  return (
    <div className="freq-panel">
      <div className="freq-panel-label">Frequency Bands</div>
      <div className="freq-bands">
        {bands.map((band, i) => (
          <div key={band.id} className="freq-band">
            <div className={`freq-band-row${band.notes || !readonly ? ' freq-band-row--with-notes' : ''}`}>
              <div className="band-info">
                <div className="band-name">{band.label}</div>
                <div className="band-range">{band.range}</div>
              </div>

              <div className="verdict-group">
                {VERDICTS.map(({ value, label }) => {
                  const active = band.verdict === value;
                  return (
                    <button
                      key={value}
                      onClick={() => !readonly && updateBand(i, { verdict: active ? null : value })}
                      className={`verdict-btn verdict-btn--${value}${active ? ' verdict-btn--active' : ''}${readonly ? ' verdict-btn--readonly' : ' verdict-btn--interactive'}`}
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
                className="band-notes"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
