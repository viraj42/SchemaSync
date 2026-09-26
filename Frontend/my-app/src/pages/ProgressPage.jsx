/*
 * ProgressPage.jsx
 * Real-time job progress tracker.
 *
 * Flow:
 *   1. Reads :jobId from the URL params.
 *   2. Polls GET /api/jobs/:jobId every 2 seconds while the job is PENDING or PROCESSING.
 *   3. Stops polling once the job reaches a terminal state (COMPLETED, PARTIAL_FAILURE, etc.).
 *   4. Shows stats (total / processed / failed) and a link to the failures review page.
 *
 * Key React concepts:
 *   - useParams    : reads the :jobId segment from the URL
 *   - useState     : stores the job object and error flag
 *   - useEffect    : starts/stops the polling interval on mount/unmount
 *   - useCallback  : memoises fetchJob so useEffect deps are stable
 *   - useRef       : holds the interval ID without causing re-renders
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getJob } from '../api/jobs';
import StatusTag from '../components/StatusTag';
import ProgressBar from '../components/ProgressBar';
import Skeleton from '../components/Skeleton';

// Statuses that mean the job is still running
const ACTIVE_STATUSES = new Set(['PENDING', 'PROCESSING']);

export default function ProgressPage() {
  const { jobId }         = useParams();
  const [job, setJob]     = useState(null);    // The job object from the API
  const [error, setError] = useState(false);   // True if a fetch failed
  const timerRef          = useRef(null);       // Stores the setInterval ID

  // ---- Fetch job status from the backend ----
  const fetchJob = useCallback(async () => {
    try {
      setError(false);
      const data = await getJob(jobId);         // GET /api/jobs/:jobId

      if (data) {
        setJob(data);

        // Stop polling if the job has finished
        if (!ACTIVE_STATUSES.has(data.status)) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    } catch {
      setError(true);
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [jobId]);

  // ---- Start polling on mount; clean up on unmount ----
  useEffect(() => {
    fetchJob();                                 // Immediate first fetch
    timerRef.current = setInterval(fetchJob, 2000); // Then every 2 s

    return () => {
      clearInterval(timerRef.current);          // Clean up when component unmounts
      timerRef.current = null;
    };
  }, [fetchJob]);

  // ---- Retry handler (after an error) ----
  const handleRetry = () => {
    fetchJob();
    if (!timerRef.current) {
      timerRef.current = setInterval(fetchJob, 2000);
    }
  };

  /* ========== LOADING STATE ========== */
  if (!job && !error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-6">
        <div className="card flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-2 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </div>
    );
  }

  /* ========== ERROR STATE ========== */
  if (error && !job) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div
          className="card text-center py-12 fade-in-up"
          style={{ borderColor: 'rgba(248,113,113,0.2)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Could not load job
          </p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            There was a problem fetching the job status.
          </p>
          <button
            type="button"
            id="retry-fetch-btn"
            onClick={handleRetry}
            className="btn-ghost mx-auto"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* ========== LOADED STATE ========== */
  const processed     = job.processedRecords || 0;
  const failed        = job.failedRecords    || 0;
  const total         = job.totalRecords     || 0;
  const done          = processed + failed;
  const progressPct   = total > 0 ? (done / total) * 100 : 0;
  const isActive      = ACTIVE_STATUSES.has(job.status);
  const isCompleted   = job.status === 'COMPLETED';
  const hasFailures   = failed > 0;

  return (
    <div
      id="progress-page"
      className="max-w-2xl mx-auto px-4 py-12 fade-in-up"
    >
      {/* ---- Step indicator ---- */}
      <div className="flex items-center gap-2 mb-8">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          Step 2 of 2
        </span>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Processing in progress</span>
      </div>

      {/* ---- Main Card ---- */}
      <div
        className="card flex flex-col gap-7"
        style={{
          boxShadow: '0 4px 40px rgba(0,0,0,0.25)',
          borderColor: isCompleted ? 'rgba(52,211,153,0.2)' : hasFailures ? 'rgba(251,191,36,0.2)' : 'var(--border)',
        }}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {/* File icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Ingestion Job</span>
            </div>
            <h1 className="text-xl font-bold truncate mono" style={{ color: 'var(--text-primary)' }}>
              {job.fileName}
            </h1>
            <p className="text-xs mt-1 mono" style={{ color: 'var(--text-secondary)' }}>
              ID: {job.jobId}
            </p>
          </div>
          <StatusTag value={job.status} kind="jobStatus" />
        </div>

        {/* Progress Bar + Percentage */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span>
              {isActive ? 'Processing…' : 'Processing complete'}
            </span>
            <span className="font-semibold mono" style={{ color: 'var(--text-primary)' }}>
              {Math.round(progressPct)}%
            </span>
          </div>
          <ProgressBar value={progressPct} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Total */}
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
              Total
            </p>
            <p className="text-2xl font-bold mono" style={{ color: 'var(--text-primary)' }}>
              {total.toLocaleString()}
            </p>
          </div>

          {/* Processed */}
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--success)' }}>
              Processed
            </p>
            <p className="text-2xl font-bold mono" style={{ color: 'var(--success)' }}>
              {processed.toLocaleString()}
            </p>
          </div>

          {/* Failed */}
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: hasFailures ? 'rgba(248,113,113,0.06)' : 'rgba(52,211,153,0.04)',
              border: `1px solid ${hasFailures ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.1)'}`,
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: hasFailures ? 'var(--danger)' : 'var(--text-secondary)' }}
            >
              Failed
            </p>
            <p
              className="text-2xl font-bold mono"
              style={{ color: hasFailures ? 'var(--danger)' : 'var(--text-secondary)' }}
            >
              {failed.toLocaleString()}
            </p>
          </div>
        </div>

        {/* ---- Footer: action buttons ---- */}
        {!isActive && (
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            {/* Back to upload */}
            <Link
              to="/"
              className="btn-ghost"
              id="new-upload-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              New upload
            </Link>

            {/* Review failures (only if there are failures) */}
            {hasFailures && (
              <Link
                to={`/jobs/${jobId}/failures`}
                id="review-failures-btn"
                className="btn-primary"
              >
                Review {failed} failure{failed !== 1 ? 's' : ''}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
            )}

            {/* Completed with no failures */}
            {isCompleted && !hasFailures && (
              <div
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: 'var(--success)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                All records processed successfully!
              </div>
            )}
          </div>
        )}

        {/* Active spinner indicator */}
        {isActive && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Auto-refreshing every 2 seconds…
          </div>
        )}
      </div>
    </div>
  );
}
