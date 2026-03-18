import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { useAuth } from '../hooks/useAuth';
import { uploadAudio } from '../firebase/storage';
import { createTrack } from '../firebase/firestore';
import { AudioDropZone } from '../components/upload/AudioDropZone';
import { UploadProgress } from '../components/upload/UploadProgress';

export const UploadPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (f: File) => {
    setFile(f);
    setTitle(f.name.replace(/\.(mp3|wav)$/i, ''));
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    setError('');

    const trackId = nanoid(12);

    try {
      const { downloadURL, storagePath } = await uploadAudio(
        user.uid,
        trackId,
        file,
        setProgress
      );

      await createTrack(trackId, {
        ownerId: user.uid,
        title: title || file.name,
        fileName: file.name,
        storagePath,
        downloadURL,
      });

      navigate(`/review/${trackId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>Upload a Track</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>MP3 or WAV, up to 200 MB. Share the link with anyone to collect feedback.</p>
      </div>

      {!uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <AudioDropZone onFile={handleFile} />

          {file && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px', flexShrink: 0 }}>
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Track title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title..."
                  style={{ width: '100%' }}
                />
              </div>

              {error && (
                <div style={{ color: 'var(--accent-red)', fontSize: '13px', padding: '10px 12px', background: 'rgba(247,106,106,0.1)', borderRadius: 'var(--radius)' }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleUpload}
                style={{
                  background: 'var(--accent-violet)',
                  color: '#fff',
                  padding: '12px',
                  borderRadius: 'var(--radius)',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                Upload &amp; Get Share Link
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <UploadProgress progress={progress} fileName={file!.name} />
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
            {progress < 1 ? 'Uploading...' : 'Finalizing...'}
          </div>
        </div>
      )}
    </div>
  );
};
