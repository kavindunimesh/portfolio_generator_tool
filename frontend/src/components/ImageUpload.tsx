import { useEffect, useId, useRef, useState } from 'react';
import { api } from '../api';
import { useToast } from '../toast';

type ImageUploadProps = {
  label: string;
  value: string;
  purpose: 'avatar' | 'project' | 'logo';
  onChange: (url: string) => void;
  previewClassName?: string;
  compact?: boolean;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ImageUpload({
  label,
  value,
  purpose,
  onChange,
  previewClassName = '',
  compact = false,
}: ImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useToast();
  const [uploading, setUploading] = useState(false);
  const [quota, setQuota] = useState<{ usedBytes: number; maxBytes: number } | null>(null);

  useEffect(() => {
    api
      .uploadQuota()
      .then((data) => setQuota({ usedBytes: data.usedBytes, maxBytes: data.maxBytes }))
      .catch(() => setQuota(null));
  }, []);

  async function handleFileChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Invalid file', 'Please choose an image file.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      error('File too large', 'Images must be 8MB or smaller before upload.');
      return;
    }

    setUploading(true);
    try {
      const result = await api.uploadImage(file, purpose, value || undefined);
      onChange(result.url);
      setQuota({ usedBytes: result.usedBytes, maxBytes: result.maxBytes });
      success('Image uploaded', 'Compressed and saved to your storage.');
    } catch (err) {
      error('Upload failed', err instanceof Error ? err.message : 'Could not upload image');
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  return (
    <div className={`image-upload ${compact ? 'image-upload--logo' : 'span-2'}`}>
      <div className="image-upload-head">
        <label htmlFor={inputId}>{label}</label>
        {!compact && quota && (
          <span className="image-upload-quota">
            {formatBytes(quota.usedBytes)} / {formatBytes(quota.maxBytes)} used
          </span>
        )}
      </div>

      <div className={`image-upload-body ${compact ? 'logo-preview' : ''} ${previewClassName}`}>
        {value ? (
          <div className="image-upload-preview">
            <img src={value} alt="" />
          </div>
        ) : (
          <div className="image-upload-placeholder">
            <span>{compact ? 'Logo' : 'No image yet'}</span>
          </div>
        )}

        <div className="image-upload-actions">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => void handleFileChange(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Uploading…' : value ? (compact ? 'Replace' : 'Replace image') : compact ? 'Upload logo' : 'Upload image'}
          </button>
          {value && (
            <button
              type="button"
              className="btn-text danger"
              disabled={uploading}
              onClick={() => onChange('')}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <label className="image-upload-url">
        Or paste image URL
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          disabled={uploading}
        />
      </label>
      <p className="image-upload-hint">
        Images are compressed to WebP automatically. Max 10MB total storage per account.
      </p>
    </div>
  );
}
