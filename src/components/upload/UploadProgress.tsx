import './UploadProgress.css';

interface UploadProgressProps {
  progress: number;
  fileName: string;
}

export const UploadProgress = ({ progress, fileName }: UploadProgressProps) => {
  const pct = Math.round(progress * 100);

  return (
    <div className="upload-progress">
      <div className="upload-progress-info">
        <span className="upload-progress-filename">{fileName}</span>
        <span className="upload-progress-pct">{pct}%</span>
      </div>
      <div className="upload-progress-track">
        <div className="upload-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};
