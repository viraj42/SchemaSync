import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getJob } from '../api/jobs';
import StatusTag from '../components/StatusTag';
import ProgressBar from '../components/ProgressBar';
import Skeleton from '../components/Skeleton';

export default function ProgressPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState(false);
  const timerRef = useRef(null);

  const fetchJob = useCallback(async () => {
    try {
      setError(false);
      const data = await getJob(jobId);
      if (data) {
        setJob(data);
        if (data.status !== 'PENDING' && data.status !== 'PROCESSING') {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      }
    } catch {
      setError(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
    timerRef.current = setInterval(fetchJob, 2000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fetchJob]);

  useEffect(() => {
    if (job && job.status !== 'PENDING' && job.status !== 'PROCESSING') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [job]);

  if (error && !job) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-primary mb-2">Couldn&apos;t load this job.</p>
        <button
          type="button"
          onClick={() => {
            fetchJob();
            if (!timerRef.current) {
              timerRef.current = setInterval(fetchJob, 2000);
            }
          }}
          className="text-accent underline-offset-2 hover:underline bg-transparent border-0 p-0 cursor-pointer text-base"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-[6px] w-full" />
        <div className="flex items-center gap-6">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    );
  }

  const processed = job.processedRecords || 0;
  const failed = job.failedRecords || 0;
  const total = job.totalRecords || 0;
  const progressPercent = total > 0 ? ((processed + failed) / total) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto p-8 mt-8 bg-surface border border-border/60 rounded-2xl shadow-sm flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-primary tracking-tight">{job.fileName}</h1>
          <p className="text-sm text-secondary mt-1">Processing your data...</p>
        </div>
        <StatusTag value={job.status} kind="jobStatus" />
      </div>

      <div className="py-2">
        <ProgressBar value={progressPercent} />
      </div>

      <div className="flex items-center justify-between bg-bg rounded-xl p-5 border border-border/50">
        <div className="flex items-center gap-8 text-secondary text-sm">
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wider mb-1 opacity-70">Total</span>
            <strong className="text-primary font-semibold text-lg">{total}</strong>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wider mb-1 opacity-70">Processed</span>
            <strong className="text-success font-semibold text-lg">{processed}</strong>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wider mb-1 opacity-70">Failed</span>
            <strong className="text-danger font-semibold text-lg">{failed}</strong>
          </div>
        </div>
        {failed > 0 && (
          <Link
            to={`/jobs/${jobId}/failures`}
            className="flex items-center gap-1 text-accent hover:text-accent-hover font-medium bg-accent/10 px-4 py-2 rounded-lg transition-colors"
          >
            Review failures
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </Link>
        )}
      </div>
    </div>
  );
}
