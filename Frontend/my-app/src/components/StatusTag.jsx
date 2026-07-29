const TAG_MAP = {
  PENDING: { label: 'Pending', tokenClass: 'text-info bg-info/10 border-info/20' },
  PROCESSING: { label: 'Processing', tokenClass: 'text-info bg-info/10 border-info/20' },
  COMPLETED: { label: 'Completed', tokenClass: 'text-success bg-success/10 border-success/20' },
  PARTIAL_FAILURE: { label: 'Partial failure', tokenClass: 'text-warning bg-warning/10 border-warning/20' },
  PARSE_ERROR: { label: 'Malformed row', tokenClass: 'text-danger bg-danger/10 border-danger/20' },
  MISSING_REQUIRED_FIELD: { label: 'Missing required field', tokenClass: 'text-warning bg-warning/10 border-warning/20' },
  SCHEMA_MISMATCH: { label: 'Schema mismatch', tokenClass: 'text-warning bg-warning/10 border-warning/20' },
  TYPE_INVALID: { label: 'Invalid value type', tokenClass: 'text-warning bg-warning/10 border-warning/20' },
  LLM_RATE_LIMITED: { label: 'Rate limited', tokenClass: 'text-info bg-info/10 border-info/20' },
  TRANSIENT_ERROR: { label: 'Temporary error', tokenClass: 'text-info bg-info/10 border-info/20' },
};

export default function StatusTag({ value, kind }) {
  const config = TAG_MAP[value] || { label: value || 'Unknown', tokenClass: 'text-secondary bg-border/30 border-border/50' };
  return (
    <span className={`${config.tokenClass} border rounded-full px-2.5 py-1 text-xs font-medium inline-flex items-center tracking-wide`}>
      {config.label}
    </span>
  );
}
