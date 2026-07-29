export default function ProgressBar({ value = 0 }) {
  const clampedValue = Math.min(100, Math.max(0, value || 0));
  return (
    <div className="w-full bg-border/50 rounded-full h-2 overflow-hidden shadow-inner">
      <div
        className="bg-accent h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
