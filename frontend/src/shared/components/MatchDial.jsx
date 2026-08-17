/**
 * The signature ITAP component (docs/05-ui-ux-design-system.md §2, docs/07 §3.1).
 * Reproduces the exact semicircular-gauge SVG technique used across the Stitch design
 * export (itap_dashboard/code.html): a 36x36 viewBox donut-path rotated -90deg, where the
 * *track* is drawn to half the circle's circumference (dasharray "50,100") to read as a
 * semicircle, and the *fill* path is drawn to (score/100)*50 of that same circumference.
 */
const SIZE_PX = { sm: 32, md: 40, lg: 96 };
const FONT_CLASS = { sm: "text-[10px]", md: "text-data-mono", lg: "text-display-md" };

export default function MatchDial({ score = 0, size = "md", showLabel = true }) {
  const clamped = Math.max(0, Math.min(100, score));
  const fillLength = (clamped / 100) * 50;
  const px = SIZE_PX[size];

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: px, height: px }}
      role="img"
      aria-label={`Match score ${Math.round(clamped)} out of 100`}
    >
      <svg className="transform -rotate-90" viewBox="0 0 36 36" style={{ width: px, height: px }} aria-hidden="true">
        <path
          className="text-surface-variant stroke-current"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          strokeDasharray="50, 100"
          strokeWidth="3"
        />
        <path
          className="text-secondary-fixed-dim stroke-current transition-[stroke-dasharray] duration-500 ease-out"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          strokeDasharray={`${fillLength}, 100`}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {showLabel && (
        <span className={`absolute font-data-mono ${FONT_CLASS[size]} text-on-surface`}>{Math.round(clamped)}</span>
      )}
    </div>
  );
}
