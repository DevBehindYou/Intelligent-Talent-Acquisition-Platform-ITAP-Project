// Transcribed layout from ai_search_configuration/code.html's "Weighting Configuration"
// sliders — a thin track + small rectangular thumb, labeled left, value shown right in mono.
export default function InstrumentSlider({ label, description, value, onChange, icon }) {
  return (
    <div className="p-md md:p-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-6 hairline-b hover:bg-surface-container-low/30 transition-colors">
      <div className="w-full md:w-48 flex-shrink-0">
        <span className="font-label-caps text-label-caps text-on-surface block mb-1 uppercase">{label}</span>
        <span className="font-body-sm text-body-sm text-outline flex items-center gap-1">
          {icon}
          {description}
        </span>
      </div>
      <div className="flex-1 relative flex items-center">
        <div className="absolute w-full h-[2px] bg-outline-variant/30 rounded" />
        <div className="absolute h-[2px] bg-secondary-container rounded" style={{ width: `${value}%` }} />
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="instrument-slider relative z-10 w-full"
          aria-label={label}
        />
      </div>
      <div className="w-16 text-right flex-shrink-0">
        <span className="font-data-mono text-[16px] text-on-background font-medium">{value}%</span>
      </div>
    </div>
  );
}
