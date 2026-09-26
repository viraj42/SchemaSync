/*
 * UploadPage.jsx
 * The main data ingestion entry point.
 *
 * Flow:
 *   1. User drags & drops OR clicks to select a CSV file.
 *   2. On submit, calls uploadFile() which hits POST /api/jobs/upload (multipart).
 *   3. Backend responds with { jobId } — a UUID identifying the ingestion job.
 *   4. User is redirected to /jobs/:jobId to watch real-time progress.
 *
 * Key React concepts used:
 *   - useState  : tracks selected file, error, and uploading flag
 *   - useRef    : reference to the hidden <input type="file"> (for programmatic click)
 *   - useNavigate: redirects to the job progress page after a successful upload
 */
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../api/jobs';

export default function UploadPage() {
  const [file, setFile]         = useState(null);   // Selected File object (or null)
  const [error, setError]       = useState('');     // Error string shown to the user
  const [uploading, setUploading] = useState(false); // True while awaiting the server
  const [dragActive, setDragActive] = useState(false); // True while a file is dragged over

  const fileInputRef = useRef(null); // Reference to the hidden file input
  const navigate     = useNavigate();

  // ---- File validation helper ----
  const isValidFile = (f) => f.name.endsWith('.csv') || f.type === 'text/csv';

  // ---- Drag & Drop handlers ----
  const handleDragOver = (e) => {
    e.preventDefault();          // Allow drop
    setDragActive(true);
  };
  const handleDragLeave = () => setDragActive(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    if (!isValidFile(dropped)) {
      setError('Only CSV files are accepted.');
      return;
    }
    setFile(dropped);
    setError('');
  };

  // ---- File input change handler ----
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError('');
    }
  };

  // ---- Remove selected file ----
  const handleRemoveFile = (e) => {
    e.stopPropagation();         // Don't trigger the drop zone click
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---- Form submit: upload the CSV ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      // POST /api/jobs/upload — sends multipart/form-data with the CSV
      const response = await uploadFile(file);

      if (response?.jobId) {
        // Navigate to the job progress page
        navigate(`/jobs/${response.jobId}`);
      } else {
        throw new Error('No job ID returned from server.');
      }
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Format bytes to a human-readable string (e.g. "1.2 MB")
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      id="upload-page"
      className="max-w-2xl mx-auto px-4 py-12 fade-in-up"
    >
      {/* ---- Page Header ---- */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          {/* Step indicator */}
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            Step 1 of 2
          </span>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Upload your data
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Upload a CSV file to begin AI-powered schema mapping and ingestion.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* ---- Drop Zone ---- */}
        <div
          id="drop-zone"
          onClick={() => !file && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={file ? -1 : 0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
          aria-label="Upload CSV file"
          className="rounded-2xl transition-all duration-300 overflow-hidden"
          style={{
            border: `2px dashed ${dragActive ? 'var(--accent)' : file ? 'var(--border-bright)' : 'var(--border)'}`,
            background: dragActive
              ? 'rgba(99,102,241,0.06)'
              : file
              ? 'var(--surface-2)'
              : 'var(--surface)',
            cursor: file ? 'default' : 'pointer',
            boxShadow: dragActive ? '0 0 0 4px rgba(99,102,241,0.12)' : 'none',
          }}
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-file-input"
            aria-label="CSV file input"
          />

          {file ? (
            /* ---- File Selected State ---- */
            <div className="p-6 flex items-center gap-4">
              {/* File icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              {/* File details */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate mono text-sm" style={{ color: 'var(--text-primary)' }}>
                  {file.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {formatSize(file.size)}
                </p>
              </div>
              {/* Remove file button */}
              <button
                type="button"
                id="remove-file-btn"
                onClick={handleRemoveFile}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                title="Remove file"
                aria-label="Remove selected file"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ) : (
            /* ---- Empty / Drag State ---- */
            <div className="p-16 flex flex-col items-center gap-4 select-none">
              {/* Upload icon with gradient background */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: dragActive
                    ? 'linear-gradient(135deg, var(--grad-start), var(--grad-mid))'
                    : 'rgba(99,102,241,0.1)',
                  color: dragActive ? 'white' : 'var(--accent)',
                  transition: 'all 0.2s ease',
                  boxShadow: dragActive ? '0 8px 24px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 16 12 12 8 16"/>
                  <line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                  {dragActive ? 'Drop it here!' : 'Drag & drop your CSV'}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  or{' '}
                  <span style={{ color: 'var(--accent)' }} className="font-medium">
                    click to browse
                  </span>
                  {' '}— CSV only, max 50 MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ---- Error Banner ---- */}
        {error && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium fade-in-up"
            style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.2)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {error}
          </div>
        )}

        {/* ---- What happens next info box ---- */}
        {!file && (
          <div
            className="rounded-xl p-4 fade-in-up-delay-1"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
              What happens after upload?
            </p>
            <div className="flex flex-col gap-2">
              {[
                { icon: '⚡', text: 'Your CSV is parsed and queued for processing via Kafka' },
                { icon: '🤖', text: 'Gemini AI maps each row to the target schema' },
                { icon: '✅', text: 'Successful records are saved; failures go to the review queue' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- Submit Button ---- */}
        <div className="flex justify-end">
          <button
            id="start-processing-btn"
            type="submit"
            disabled={!file || uploading}
            className="btn-primary px-8"
          >
            {uploading ? (
              <>
                <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Uploading…
              </>
            ) : (
              <>
                Start processing
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
