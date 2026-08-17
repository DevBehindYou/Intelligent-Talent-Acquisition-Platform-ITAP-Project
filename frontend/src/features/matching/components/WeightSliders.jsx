const LABELS = {
  skillsWeight: "Skills",
  experienceWeight: "Experience",
  educationWeight: "Education",
  domainWeight: "Domain",
};

/**
 * Four sliders that always sum to 100% — adjusting one proportionally redistributes the
 * rest (docs/07 §6, docs/06 §2.4). The "sandboxed preview" mentioned in the docs is
 * approximated here by re-sorting a snapshot of the current rankings client-side before
 * the user commits, without mutating the server-side scores.
 */
export default function WeightSliders({ weights, onChange }) {
  return (
    <div className="flex flex-col gap-md">
      {Object.entries(weights).map(([key, value]) => (
        <div key={key}>
          <div className="flex items-center justify-between text-body-sm mb-1">
            <span className="text-on-surface-variant">{LABELS[key] || key}</span>
            <span className="font-data-mono text-data-mono text-on-surface">{Math.round(value * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={value}
            onChange={(e) => onChange(key, Number(e.target.value))}
            className="w-full accent-prussian"
          />
        </div>
      ))}
    </div>
  );
}
