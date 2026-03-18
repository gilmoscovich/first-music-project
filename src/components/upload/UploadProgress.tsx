interface UploadProgressProps {
  progress: number;
  fileName: string;
}

export const UploadProgress = ({ progress, fileName }: UploadProgressProps) => {
  const pct = Math.round(progress * 100);

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
        <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{fileName}</span>
        <span style={{ color: 'var(--accent-violet)', fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: '6px', background: 'var(--bg-raised)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'var(--accent-violet)',
          borderRadius: '3px',
          transition: 'width 0.1s ease',
        }} />
      </div>
    </div>
  );
};
