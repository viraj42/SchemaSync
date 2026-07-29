import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../api/jobs';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv') || droppedFile.type === 'text/csv') {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Please upload a CSV file');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const response = await uploadFile(file);
      if (response && response.jobId) {
        navigate('/jobs/' + response.jobId);
      } else {
        throw new Error('No job ID returned from server');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 mt-8 bg-surface border border-border/60 rounded-2xl shadow-sm">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 tracking-tight">Upload Data</h1>
        <p className="text-secondary">Select or drag and drop your CSV file to begin processing.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div
          onClick={() => !file && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center transition-all duration-300 ${
            !file ? 'border-border hover:border-accent/50 hover:bg-accent/5 cursor-pointer' : 'border-border/50 bg-bg/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <div className="flex items-center gap-4 bg-surface border border-border rounded-xl px-5 py-3 shadow-sm">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              <span className="mono text-sm text-primary font-medium">{file.name}</span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-secondary hover:text-danger p-1 rounded-md hover:bg-danger/10 transition-colors"
                title="Remove file"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-accent/10 rounded-full text-accent">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-primary font-medium text-lg">Click to upload or drag and drop</p>
                <p className="text-secondary text-sm mt-1">CSV files only, up to 50MB</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-danger/10 text-danger text-sm font-medium">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!file || uploading}
            className="bg-accent hover:bg-accent-hover text-accent-text px-8 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:transform-none disabled:shadow-none"
          >
            {uploading ? 'Processing...' : 'Start processing'}
          </button>
        </div>
      </form>
    </div>
  );
}
