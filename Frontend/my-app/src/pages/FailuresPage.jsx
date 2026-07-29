import { useState, useEffect, useCallback, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { getFailures, retryRecord, correctRecord, getJob } from '../api/jobs';
import StatusTag from '../components/StatusTag';
import Skeleton from '../components/Skeleton';

function CorrectionForm({ record, onResolved }) {
  const { jobId } = useParams();
  const [formValues, setFormValues] = useState(() => {
    let parsed = {};
    try {
      parsed = typeof record.rawPayload === 'string' ? JSON.parse(record.rawPayload) : record.rawPayload || {};
    } catch {
      parsed = {};
    }
    return {
      fullName: parsed.fullName ?? '',
      email: parsed.email ?? '',
      phone: parsed.phone ?? '',
      company: parsed.company ?? '',
      role: parsed.role ?? '',
      joinDate: parsed.joinDate ?? '',
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, val) => {
    setFormValues((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await correctRecord(jobId, record.id, formValues);
      getJob(jobId).catch(() => {});
      onResolved(record.id);
    } catch (err) {
      setError(err.message || 'Failed to update record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 p-6 bg-bg/50 rounded-2xl border border-border/50 shadow-inner">
      <p className="text-primary text-sm font-medium mb-5">
        This replaces the full record — fill in every field you want kept.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-secondary mb-1.5">Full Name</label>
          <input
            type="text"
            value={formValues.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 bg-surface border border-border/80 rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200 disabled:opacity-50 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-secondary mb-1.5">Email</label>
          <input
            type="text"
            value={formValues.email}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 bg-surface border border-border/80 rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200 disabled:opacity-50 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-secondary mb-1.5">Phone</label>
          <input
            type="text"
            value={formValues.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 bg-surface border border-border/80 rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200 disabled:opacity-50 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-secondary mb-1.5">Company</label>
          <input
            type="text"
            value={formValues.company}
            onChange={(e) => handleChange('company', e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 bg-surface border border-border/80 rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200 disabled:opacity-50 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-secondary mb-1.5">Role</label>
          <input
            type="text"
            value={formValues.role}
            onChange={(e) => handleChange('role', e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 bg-surface border border-border/80 rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200 disabled:opacity-50 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-secondary mb-1.5">Join Date</label>
          <input
            type="date"
            value={formValues.joinDate}
            onChange={(e) => handleChange('joinDate', e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 bg-surface border border-border/80 rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200 disabled:opacity-50 shadow-sm"
          />
        </div>
      </div>

      {error && (
        <p className="text-danger text-sm mb-4 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-accent hover:bg-accent-hover text-accent-text px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {loading ? 'Saving...' : 'Submit correction'}
        </button>
      </div>
    </form>
  );
}

function RawPayloadDetail({ rawPayload }) {
  let parsed = {};
  try {
    parsed = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload || {};
  } catch {
    parsed = { raw: rawPayload };
  }
  return (
    <div className="bg-surface border border-border/60 rounded-xl p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-secondary mb-3">Original Payload</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        {Object.entries(parsed || {}).map(([k, v]) => (
          <div key={k} className="mono text-sm text-primary flex items-start gap-2">
            <span className="text-secondary/70 shrink-0">{k}:</span>
            <span className="break-all font-medium">{String(v ?? '')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FailuresPage() {
  const { jobId } = useParams();
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reasonFilter, setReasonFilter] = useState('ALL');

  const [expandedRows, setExpandedRows] = useState({});
  const [editingRows, setEditingRows] = useState({});
  const [retriedRows, setRetriedRows] = useState({});
  const [retryingRows, setRetryingRows] = useState({});

  const fetchFailures = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getFailures(jobId, page, 20);
      setData(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [jobId, page]);

  useEffect(() => {
    fetchFailures();
  }, [fetchFailures]);

  const handleRowClick = (recordId, e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) {
      return;
    }
    setExpandedRows((prev) => ({
      ...prev,
      [recordId]: !prev[recordId],
    }));
  };

  const handleRetry = async (recordId, e) => {
    e.stopPropagation();
    setRetryingRows((prev) => ({ ...prev, [recordId]: true }));
    try {
      await retryRecord(jobId, recordId);
      setRetriedRows((prev) => ({ ...prev, [recordId]: true }));
    } catch {
      // Keep button state if retry fails
    } finally {
      setRetryingRows((prev) => ({ ...prev, [recordId]: false }));
    }
  };

  const handleEditClick = (recordId, e) => {
    e.stopPropagation();
    setEditingRows((prev) => {
      const nextState = !prev[recordId];
      if (nextState) {
        setExpandedRows((exp) => ({ ...exp, [recordId]: true }));
      }
      return { ...prev, [recordId]: nextState };
    });
  };

  const handleResolved = (recordId) => {
    setEditingRows((prev) => ({ ...prev, [recordId]: false }));
    if (data && data.content) {
      const updatedContent = data.content.map((item) => {
        if (item.id === recordId) {
          return {
            ...item,
            status: 'RESOLVED',
            resolvedAt: new Date().toISOString(),
          };
        }
        return item;
      });
      setData({ ...data, content: updatedContent });
    }
  };

  if (loading && !data) {
    return (
      <div className="max-w-5xl mx-auto p-6 flex flex-col gap-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center">
        <p className="text-primary mb-2">Couldn&apos;t load failures.</p>
        <button
          type="button"
          onClick={fetchFailures}
          className="text-accent underline-offset-2 hover:underline border-0 bg-transparent cursor-pointer text-base"
        >
          Retry
        </button>
      </div>
    );
  }

  if (data && data.totalElements === 0) {
      <div className="max-w-5xl mx-auto p-8 mt-8 bg-surface border border-border/60 rounded-2xl shadow-sm">
        <h1 className="text-3xl font-bold text-primary mb-2 tracking-tight">Review Failures</h1>
        <div className="py-12 text-center flex flex-col items-center justify-center">
          <div className="p-4 bg-success/10 rounded-full text-success mb-4">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <p className="text-primary font-medium text-lg">All caught up!</p>
          <p className="text-secondary">No failures to review for this job.</p>
        </div>
      </div>
  }

  const allContent = data?.content || [];
  const filteredContent = allContent.filter((item) => {
    if (reasonFilter === 'ALL') return true;
    return item.failureReason === reasonFilter;
  });

  return (
    <div className="max-w-5xl mx-auto p-8 mt-8 bg-surface border border-border/60 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight">Review Failures</h1>
        <div className="flex items-center gap-3">
          <label htmlFor="reasonFilter" className="text-sm font-medium text-secondary">Filter</label>
          <select
            id="reasonFilter"
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="bg-bg border border-border/80 rounded-xl px-4 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent shadow-sm transition-all duration-200"
          >
            <option className="bg-surface text-primary" value="ALL">All reasons</option>
            <option className="bg-surface text-primary" value="PARSE_ERROR">Malformed row</option>
            <option className="bg-surface text-primary" value="MISSING_REQUIRED_FIELD">Missing required field</option>
            <option className="bg-surface text-primary" value="SCHEMA_MISMATCH">Schema mismatch</option>
            <option className="bg-surface text-primary" value="TYPE_INVALID">Invalid value type</option>
            <option className="bg-surface text-primary" value="LLM_RATE_LIMITED">Rate limited</option>
            <option className="bg-surface text-primary" value="TRANSIENT_ERROR">Temporary error</option>
          </select>
        </div>
      </div>

      <div className="border border-border/50 rounded-xl overflow-hidden bg-surface shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/50 bg-bg/50">
              <th className="py-4 px-5 text-xs font-semibold uppercase tracking-wider text-secondary">Row</th>
              <th className="py-4 px-5 text-xs font-semibold uppercase tracking-wider text-secondary">Reason</th>
              <th className="py-4 px-5 text-xs font-semibold uppercase tracking-wider text-secondary">Created</th>
              <th className="py-4 px-5 text-xs font-semibold uppercase tracking-wider text-secondary">Status</th>
              <th className="py-4 px-5 text-xs font-semibold uppercase tracking-wider text-secondary">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredContent.map((item) => {
              const isExpanded = Boolean(expandedRows[item.id]);
              const isEditing = Boolean(editingRows[item.id]);
              const isResolved = item.status === 'RESOLVED';
              const isRetryable = item.failureReason === 'LLM_RATE_LIMITED' || item.failureReason === 'TRANSIENT_ERROR';
              const isQueued = retriedRows[item.id] || item.status === 'PENDING_RETRY';

              return (
                <Fragment key={item.id}>
                  <tr
                    onClick={(e) => handleRowClick(item.id, e)}
                    className="border-b border-border/30 hover:bg-bg/30 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-5 text-sm font-medium text-primary align-middle">
                      {item.rowIndex}
                    </td>
                    <td className="py-4 px-5 align-middle">
                      <StatusTag value={item.failureReason} kind="failureReason" />
                    </td>
                    <td className="py-4 px-5 text-sm text-secondary align-middle">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-5 text-sm font-medium text-primary align-middle">
                      {item.status === 'RESOLVED' ? (
                        <span className="text-success inline-flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          Resolved
                        </span>
                      ) : (
                        item.status
                      )}
                    </td>
                    <td className="py-4 px-5 align-middle" onClick={(e) => e.stopPropagation()}>
                      {isResolved ? (
                        <div className="text-sm text-secondary">
                          {item.resolvedAt && (
                            <span className="text-xs text-secondary/70">
                              {new Date(item.resolvedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      ) : isRetryable ? (
                        isQueued ? (
                          <span className="text-sm text-secondary font-medium">Queued.</span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleRetry(item.id, e)}
                            disabled={retryingRows[item.id]}
                            className="border border-border/80 bg-surface text-primary hover:border-accent hover:text-accent px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-50 shadow-sm"
                          >
                            {retryingRows[item.id] ? 'Retrying...' : 'Retry'}
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleEditClick(item.id, e)}
                          className={`border border-border/80 bg-surface px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 shadow-sm ${
                            isEditing 
                              ? 'text-danger border-danger hover:bg-danger/5' 
                              : 'text-primary hover:border-accent hover:text-accent'
                          }`}
                        >
                          {isEditing ? 'Close' : 'Edit'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {(isExpanded || isEditing) && (
                    <tr className="border-b border-border/50 bg-bg/20">
                      <td colSpan={5} className="p-5">
                        <RawPayloadDetail rawPayload={item.rawPayload} />
                        {isEditing && !isResolved && (
                          <CorrectionForm record={item} onResolved={handleResolved} />
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filteredContent.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-secondary text-sm">
                  No records match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-secondary">
            Page {data.number + 1} of {data.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="border border-border bg-surface px-3 py-1 rounded-md text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-border/20 transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= data.totalPages - 1}
              onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
              className="border border-border bg-surface px-3 py-1 rounded-md text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-border/20 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
