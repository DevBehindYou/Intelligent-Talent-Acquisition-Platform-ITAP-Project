const FACTORS = [
  { key: "skillScore", label: "Skills" },
  { key: "experienceScore", label: "Experience" },
  { key: "educationScore", label: "Education" },
  { key: "domainScore", label: "Domain" },
];

export default function ScoreBreakdown({ scores = {} }) {
  return (
    <div className="space-y-sm">
      {FACTORS.map(({ key, label }) => {
        const value = Math.round(scores[key] ?? 0);
        return (
          <div key={key} className="flex items-center gap-sm">
            <span className="w-24 text-body-sm text-on-surface-variant">{label}</span>
            <div className="flex-1 h-2 rounded-full bg-surface-container-high overflow-hidden">
              <div className="h-full bg-prussian rounded-full transition-all duration-500" style={{ width: `${value}%` }} />
            </div>
            <span className="w-8 text-right font-data-mono text-data-mono text-on-surface">{value}</span>
          </div>
        );
      })}
    </div>
  );
}
