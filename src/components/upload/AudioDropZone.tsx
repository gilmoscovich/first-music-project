import { useState, useRef } from 'react';

interface AudioDropZoneProps {
  onFile: (file: File) => void;
}

const ACCEPTED = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp3'];

export const AudioDropZone = ({ onFile }: AudioDropZoneProps) => {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (file: File): boolean => {
    if (!ACCEPTED.includes(file.type) && !file.name.match(/\.(mp3|wav)$/i)) {
      setError('Only MP3 and WAV files are supported.');
      return false;
    }
    if (file.size > 200 * 1024 * 1024) {
      setError('File must be under 200 MB.');
      return false;
    }
    setError('');
    return true;
  };

  const handleFile = (file: File) => {
    if (validate(file)) onFile(file);
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        style={{
          border: `2px dashed ${dragging ? 'var(--accent-violet)' : 'var(--border-bright)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'rgba(124, 106, 247, 0.05)' : 'var(--bg-surface)',
          transition: 'all 0.15s',
        }}
      >
        <svg
          width="40" height="40" viewBox="0 0 24 24" fill="none"
          stroke={dragging ? 'var(--accent-violet)' : 'var(--text-muted)'}
          strokeWidth="1.5"
          style={{ margin: '0 auto 16px', display: 'block' }}
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <div style={{ fontWeight: 600, marginBottom: '6px' }}>
          Drop your audio file here
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          or click to browse &mdash; MP3, WAV up to 200 MB
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--accent-red)', fontSize: '13px', marginTop: '8px' }}>{error}</div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav,audio/mpeg,audio/wav"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
};
