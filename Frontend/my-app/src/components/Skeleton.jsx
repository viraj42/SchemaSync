/*
 * Skeleton.jsx
 * A reusable animated skeleton placeholder for loading states.
 * Props:
 *   className - extra Tailwind/CSS classes to set dimensions
 */
export default function Skeleton({ className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      aria-hidden="true"
    />
  );
}
