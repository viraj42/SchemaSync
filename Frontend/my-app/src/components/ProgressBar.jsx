/*
 * ProgressBar.jsx
 * Animated progress bar component.
 * Props:
 *   value  - number 0-100, the fill percentage
 */
export default function ProgressBar({ value = 0 }) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className="w-full h-2 rounded-full overflow-hidden"
      style={{ background: 'var(--border)' }}
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${clampedValue}%`,
          background: 'linear-gradient(90deg, var(--grad-start), var(--grad-mid), var(--grad-end))',
          boxShadow: clampedValue > 0 ? '0 0 10px rgba(99,102,241,0.5)' : 'none',
        }}
      />
    </div>
  );
}
