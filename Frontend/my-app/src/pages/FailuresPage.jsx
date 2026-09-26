/*
 * FailuresPage.jsx
 * Dead Letter Queue (DLQ) review page.
 *
 * What this page does:
 *   - Lists failed records for a given job (GET /api/jobs/:jobId/failures?page=&size=)
 *   - Lets the user expand a row to see the original raw payload.
 *   - For retryable failures (rate-limited / transient), shows a Retry button
 *     that calls POST /api/jobs/:jobId/retry/:recordId.
 *   - For other failures, shows an Edit button that opens a CorrectionForm.
 *     The form calls PATCH /api/jobs/:jobId/failures/:recordId with the corrected fields.
 *   - Supports pagination and a reason-based filter.
 *
 * Key React concepts:
 *   - useState   : local state for page index, data, loading, filters, per-row state
 *   - useEffect  : refetch when page changes
 *   - useCallback: stable fetchFailures reference
 *   - Fragment   : render two table rows per record (main row + expanded detail row)
 */
import { useState, useEffect, useCallback, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFailures, retryRecord, correctRecord } from '../api/jobs';
import StatusTag from '../components/StatusTag';
import Skeleton from '../components/Skeleton';

/* ============================================================
   SUB-COMPONENT: CorrectionForm
   ============================================================
   Renders an inline form pre-filled with the raw payload values.
   On submit, PATCH /api/jobs/:jobId/failures/:recordId is called.
   On success, onResolved(recordId) is called to update the parent state.
*/
function CorrectionForm({ record, jobId, onResolved }) {
  // Parse the rawPayload JSON string into an object for the form
  const parsePayload = () => {
    try {
      return typeof record.rawPayload === 'string'
        ? JSON.parse(record.rawPayload)
        : (record.rawPayload || {});
    } catch {
      return {};
    }
  };

  // Initialise form fields from the raw payload
  const [formValues, setFormValues] = useState(() => {
    const p = parsePayload();
    return {
      fullName:  p.fullName  ?? '',
      email:     p.email     ?? '',
      phone:     p.phone     ?? '',
      company:   p.company   ?? '',
      role:      p.role      ?? '',
      joinDate:  p.joinDate  ?? '',
    };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Update a single field in the form
  const handleChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  // Submit the correction to the backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // PATCH /api/jobs/:jobId/failures/:recordId   with corrected field values
      await correctRecord(jobId, record.id, formValues);
      onResolved(record.id);   // Tell parent to mark this record as resolved
    } catch (err) {
      setError(err.message || 'Failed to save correction.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'fullName', label: 'Full Name', type: 'text' },
    { key: 'email',    label: 'Email',     type: 'email' },
    { key: 'phone',    label: 'Phone',     type: 'text' },
    { key: 'company',  label: 'Company',   type: 'text' },
    { key: 'role',     label: 'Role',      type: 'text' },
    { key: 'joinDate', label: 'Join Date', type: 'date' },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 rounded-2xl p-5"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
        Correct &amp; resubmit record
      </p>

      {/* Field grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        {fields.map(({ key, label, type }) => (
          <div key={key}>
            <label
              htmlFor={`field-${record.id}-${key}`}
              className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              {label}
            </label>
            <input
              id={`field-${record.id}-${key}`}
              type={type}
              value={formValues[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              disabled={loading}
              className="input-field text-sm"
            />
          </div>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div
          className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl text-sm"
          style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.2)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary text-sm px-6 py-2.5"
          style={{ borderRadius: 10 }}
          id={`submit-correction-${record.id}`}
        >
          {loading ? (
            <>
              <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Saving…
            </>
          ) : 'Submit correction'}
        </button>
      </div>
    </form>
  );
}

/* ============================================================
   SUB-COMPONENT: RawPayloadDetail
   ============================================================
   Displays the original raw payload fields in a key-value grid.
*/
function RawPayloadDetail({ rawPayload }) {
  let parsed = {};
  try {
    parsed = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : (rawPayload || {});
  } catch {
    parsed = { raw: rawPayload };
  }

  const entries = Object.entries(parsed || {});

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
        Original Payload
      </p>
      {entries.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No payload data available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-start gap-2 text-sm">
              <span className="font-medium shrink-0 mono" style={{ color: 'var(--text-secondary)', minWidth: 80 }}>
                {k}:
              </span>
              <span className="break-all mono" style={{ color: 'var(--text-primary)' }}>
                {String(v ?? '')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   FILTER OPTIONS
   ============================================================ */
const FILTER_OPTIONS = [
  { value: 'ALL',                   label: 'All reasons' },
  { value: 'PARSE_ERROR',           label: 'Malformed row' },
  { value: 'MISSING_REQUIRED_FIELD',label: 'Missing field' },
  { value: 'SCHEMA_MISMATCH',       label: 'Schema mismatch' },
  { value: 'TYPE_INVALID',          label: 'Invalid type' },
  { value: 'LLM_RATE_LIMITED',      label: 'Rate limited' },
  { value: 'TRANSIENT_ERROR',       label: 'Temporary error' },
];

const RETRYABLE = new Set(['LLM_RATE_LIMITED', 'TRANSIENT_ERROR']);

/* ============================================================
   MAIN COMPONENT: FailuresPage
   ============================================================ */
export default function FailuresPage() {
  const { jobId } = useParams();

  // Pagination state
  const [page, setPage] = useState(0);

  // Data & UI state
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  // Filter
  const [reasonFilter, setReasonFilter] = useState('ALL');

  // Per-row expand / edit / retry state
  const [expandedRows, setExpandedRows] = useState({});  // { recordId: boolean }
  const [editingRows, setEditingRows]   = useState({});  // { recordId: boolean }
  const [retriedRows, setRetriedRows]   = useState({});  // { recordId: boolean } — retried successfully
  const [retryingRows, setRetryingRows] = useState({}); // { recordId: boolean } — currently retrying

  // ---- Fetch failures list ----
  const fetchFailures = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      // GET /api/jobs/:jobId/failures?page=N&size=20
      const res = await getFailures(jobId, page, 20);
      setData(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [jobId, page]);

  // Re-fetch whenever page changes
  useEffect(() => {
    fetchFailures();
  }, [fetchFailures]);

  // ---- Toggle expand/collapse a row on click ----
  const handleRowClick = (recordId, e) => {
    // Don't toggle if the click was on an interactive element inside the row
    if (e.target.closest('button') || e.target.closest('input')) return;
    setExpandedRows((prev) => ({ ...prev, [recordId]: !prev[recordId] }));
  };

  // ---- Retry a failed record ----
  const handleRetry = async (recordId, e) => {
    e.stopPropagation();
    setRetryingRows((prev) => ({ ...prev, [recordId]: true }));
    try {
      // POST /api/jobs/:jobId/retry/:recordId
      await retryRecord(jobId, recordId);
      setRetriedRows((prev) => ({ ...prev, [recordId]: true }));
    } catch {
      // Silently fail — keep UI usable
    } finally {
      setRetryingRows((prev) => ({ ...prev, [recordId]: false }));
    }
  };

  // ---- Open/close the correction form ----
  const handleEditClick = (recordId, e) => {
    e.stopPropagation();
    setEditingRows((prev) => {
      const next = !prev[recordId];
      if (next) setExpandedRows((exp) => ({ ...exp, [recordId]: true })); // auto-expand
      return { ...prev, [recordId]: next };
    });
  };

  // ---- Called by CorrectionForm after a successful PATCH ----
  const handleResolved = (recordId) => {
    setEditingRows((prev) => ({ ...prev, [recordId]: false }));
    // Optimistically update the row status in local state
    setData((prev) => {
      if (!prev?.content) return prev;
      return {
        ...prev,
        content: prev.content.map((item) =>
          item.id === recordId
            ? { ...item, status: 'RESOLVED', resolvedAt: new Date().toISOString() }
            : item
        ),
      };
    });
  };

  /* ========== LOADING STATE ========== */
  if (loading && !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  /* ========== ERROR STATE ========== */
  if (error && !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="card text-center py-12">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Could not load failures
          </p>
          <button type="button" onClick={fetchFailures} className="btn-ghost mx-auto" id="retry-failures-btn">
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* ========== EMPTY STATE ========== */
  if (data && data.totalElements === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 fade-in-up">
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(52,211,153,0.12)', color: 'var(--success)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>All clear!</h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>No failures to review for this job.</p>
          <Link to="/" className="btn-ghost mx-auto" id="back-to-upload-empty">← New upload</Link>
        </div>
      </div>
    );
  }

  /* ========== LOADED STATE ========== */
  const allContent = data?.content || [];

  // Client-side filter by failure reason
  const filteredContent = allContent.filter(
    (item) => reasonFilter === 'ALL' || item.failureReason === reasonFilter
  );

  return (
    <div
      id="failures-page"
      className="max-w-5xl mx-auto px-4 py-12 fade-in-up"
    >
      {/* ---- Page Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            to={`/jobs/${jobId}`}
            className="inline-flex items-center gap-1 text-sm mb-3 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to job
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Review Failures
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {data?.totalElements ?? 0} record{(data?.totalElements ?? 0) !== 1 ? 's' : ''} require attention
          </p>
        </div>

        {/* Reason filter */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="reason-filter"
            className="text-sm font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            Filter:
          </label>
          <select
            id="reason-filter"
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="input-field text-sm"
            style={{ width: 'auto', padding: '0.5rem 0.875rem' }}
          >
            {FILTER_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ---- Failures Table ---- */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <table className="w-full text-left border-collapse" id="failures-table">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              {['Row', 'Reason', 'Created', 'Status', 'Action'].map((h) => (
                <th
                  key={h}
                  className="py-3 px-5 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredContent.map((item) => {
              const isExpanded  = Boolean(expandedRows[item.id]);
              const isEditing   = Boolean(editingRows[item.id]);
              const isResolved  = item.status === 'RESOLVED';
              const isRetryable = RETRYABLE.has(item.failureReason);
              const isQueued    = retriedRows[item.id] || item.status === 'PENDING_RETRY';
              const isRetrying  = Boolean(retryingRows[item.id]);

              return (
                <Fragment key={item.id}>
                  {/* ---- Main Row ---- */}
                  <tr
                    onClick={(e) => handleRowClick(item.id, e)}
                    className="transition-colors cursor-pointer"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: isExpanded ? 'var(--surface-2)' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = 'var(--surface-2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isExpanded ? 'var(--surface-2)' : 'transparent'; }}
                  >
                    {/* Row index */}
                    <td className="py-4 px-5 text-sm font-medium mono" style={{ color: 'var(--text-primary)' }}>
                      <div className="flex items-center gap-2">
                        {/* Expand indicator chevron */}
                        <svg
                          width="12" height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            color: 'var(--text-secondary)',
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                            flexShrink: 0,
                          }}
                        >
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                        #{item.rowIndex}
                      </div>
                    </td>

                    {/* Failure reason badge */}
                    <td className="py-4 px-5">
                      <StatusTag value={item.failureReason} kind="failureReason" />
                    </td>

                    {/* Created at */}
                    <td className="py-4 px-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5">
                      {isResolved ? (
                        <StatusTag value="RESOLVED" />
                      ) : (
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {item.status}
                        </span>
                      )}
                    </td>

                    {/* Action button — stop propagation to prevent row toggle */}
                    <td className="py-4 px-5" onClick={(e) => e.stopPropagation()}>
                      {isResolved ? (
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {item.resolvedAt && new Date(item.resolvedAt).toLocaleString()}
                        </span>
                      ) : isRetryable ? (
                        isQueued ? (
                          <span
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                            style={{ background: 'rgba(96,165,250,0.1)', color: 'var(--info)' }}
                          >
                            Queued
                          </span>
                        ) : (
                          <button
                            type="button"
                            id={`retry-btn-${item.id}`}
                            onClick={(e) => handleRetry(item.id, e)}
                            disabled={isRetrying}
                            className="btn-ghost text-xs px-3 py-1.5"
                            style={{ borderRadius: 8 }}
                          >
                            {isRetrying ? (
                              <>
                                <svg className="spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                </svg>
                                Retrying…
                              </>
                            ) : 'Retry'}
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          id={`edit-btn-${item.id}`}
                          onClick={(e) => handleEditClick(item.id, e)}
                          className="btn-ghost text-xs px-3 py-1.5"
                          style={{
                            borderRadius: 8,
                            borderColor: isEditing ? 'var(--danger)' : undefined,
                            color: isEditing ? 'var(--danger)' : undefined,
                          }}
                        >
                          {isEditing ? 'Close' : 'Edit'}
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* ---- Expanded Detail Row ---- */}
                  {(isExpanded || isEditing) && (
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                      <td colSpan={5} className="p-5">
                        {/* Original payload */}
                        <RawPayloadDetail rawPayload={item.rawPayload} />

                        {/* Correction form — only when editing and not yet resolved */}
                        {isEditing && !isResolved && (
                          <CorrectionForm
                            record={item}
                            jobId={jobId}
                            onResolved={handleResolved}
                          />
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}

            {/* Empty filtered state */}
            {filteredContent.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  No records match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ---- Pagination ---- */}
      {data?.totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>
            Page {(data.number ?? 0) + 1} of {data.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="prev-page-btn"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="btn-ghost px-4 py-2"
            >
              ← Previous
            </button>
            <button
              type="button"
              id="next-page-btn"
              disabled={page >= data.totalPages - 1}
              onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
              className="btn-ghost px-4 py-2"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
