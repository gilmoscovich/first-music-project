import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { useAuth } from '../hooks/useAuth';
import { uploadAudio } from '../firebase/storage';
import { createTrack } from '../firebase/firestore';
import { extractPeaks } from '../utils/extractPeaks';
import { AudioDropZone } from '../components/upload/AudioDropZone';
import { UploadProgress } from '../components/upload/UploadProgress';
import './UploadPage.css';

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
      // Run peak extraction in parallel with the upload — no extra wait time
      const [{ downloadURL, storagePath }, peaks] = await Promise.all([
        uploadAudio(user.uid, trackId, file, setProgress),
        extractPeaks(file),
      ]);

      await createTrack(trackId, {
        ownerId: user.uid,
        title: title || file.name,
        fileName: file.name,
        storagePath,
        downloadURL,
        fileSize: file.size,
        ...(peaks ? { peaks } : {}),
      });

      navigate(`/review/${trackId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-header">
        <h1 className="upload-title">Upload a Track</h1>
        <p className="upload-subtitle">MP3 or WAV, up to 200 MB. Share the link with anyone to collect feedback.</p>
      </div>

      {!uploading ? (
        <div className="upload-content">
          <AudioDropZone onFile={handleFile} />

          {file && (
            <>
              <div className="file-selected">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="file-name">{file.name}</span>
                <span className="file-size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>

              <div>
                <label className="form-label">Track title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title..."
                  style={{ width: '100%' }}
                />
              </div>

              {error && (
                <div className="upload-error">{error}</div>
              )}

              <button onClick={handleUpload} className="upload-btn">
                Upload &amp; Get Share Link
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="uploading-state">
          <UploadProgress progress={progress} fileName={file!.name} />
          <div className="uploading-hint">
            {progress < 1 ? 'Uploading...' : 'Finalizing...'}
          </div>
        </div>
      )}
    </div>
  );
};
