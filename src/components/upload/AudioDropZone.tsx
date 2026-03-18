import { useState, useRef } from 'react';
import './AudioDropZone.css';

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
        className={`dropzone${dragging ? ' dropzone--dragging' : ''}`}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="dropzone-icon"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <div className="dropzone-title">Drop your audio file here</div>
        <div className="dropzone-hint">or click to browse &mdash; MP3, WAV up to 200 MB</div>
      </div>

      {error && <div className="dropzone-error">{error}</div>}

      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav,audio/mpeg,audio/wav"
        className="dropzone-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
};
