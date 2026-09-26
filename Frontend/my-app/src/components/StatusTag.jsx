/*
 * StatusTag.jsx
 * Displays a colored badge for job statuses and failure reasons.
 * Props:
 *   value - the status string (e.g. "PENDING", "PARSE_ERROR")
 *   kind  - "jobStatus" | "failureReason" (unused but kept for API compat)
 */

// Maps each status/reason to a label and a color style
const TAG_CONFIG = {
  // Job statuses
  PENDING: {
    label: 'Pending',
    dot: '#60a5fa',
    style: { color: '#60a5fa', background: 'rgba(96,165,250,0.12)', borderColor: 'rgba(96,165,250,0.25)' },
  },
  PROCESSING: {
    label: 'Processing',
    dot: '#a78bfa',
    style: { color: '#a78bfa', background: 'rgba(167,139,250,0.12)', borderColor: 'rgba(167,139,250,0.25)' },
    pulse: true,
  },
  COMPLETED: {
    label: 'Completed',
    dot: '#34d399',
    style: { color: '#34d399', background: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.25)' },
  },
  PARTIAL_FAILURE: {
    label: 'Partial failure',
    dot: '#fbbf24',
    style: { color: '#fbbf24', background: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.25)' },
  },
  // Failure reasons
  PARSE_ERROR: {
    label: 'Malformed row',
    dot: '#f87171',
    style: { color: '#f87171', background: 'rgba(248,113,113,0.12)', borderColor: 'rgba(248,113,113,0.25)' },
  },
  MISSING_REQUIRED_FIELD: {
    label: 'Missing field',
    dot: '#fbbf24',
    style: { color: '#fbbf24', background: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.25)' },
  },
  SCHEMA_MISMATCH: {
    label: 'Schema mismatch',
    dot: '#fbbf24',
    style: { color: '#fbbf24', background: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.25)' },
  },
  TYPE_INVALID: {
    label: 'Invalid type',
    dot: '#fb923c',
    style: { color: '#fb923c', background: 'rgba(251,146,60,0.12)', borderColor: 'rgba(251,146,60,0.25)' },
  },
  LLM_RATE_LIMITED: {
    label: 'Rate limited',
    dot: '#60a5fa',
    style: { color: '#60a5fa', background: 'rgba(96,165,250,0.12)', borderColor: 'rgba(96,165,250,0.25)' },
  },
  TRANSIENT_ERROR: {
    label: 'Temp error',
    dot: '#94a3b8',
    style: { color: '#94a3b8', background: 'rgba(148,163,184,0.12)', borderColor: 'rgba(148,163,184,0.25)' },
  },
  RESOLVED: {
    label: 'Resolved',
    dot: '#34d399',
    style: { color: '#34d399', background: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.25)' },
  },
};

export default function StatusTag({ value }) {
  // Look up the config, or fall back to a neutral default
  const cfg = TAG_CONFIG[value] || {
    label: value || 'Unknown',
    dot: '#8899b8',
    style: { color: '#8899b8', background: 'rgba(136,153,184,0.1)', borderColor: 'rgba(136,153,184,0.2)' },
  };

  return (
    <span
      className="tag"
      style={cfg.style}
    >
      {/* Pulsing dot for active/processing states */}
      <span
        className={cfg.pulse ? 'pulse-dot' : ''}
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: cfg.dot,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}
