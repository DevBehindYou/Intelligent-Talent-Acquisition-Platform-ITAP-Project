import Icon from "../../../shared/components/Icon.jsx";

const STATUSES = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "draft", label: "Draft" },
  { value: "on_hold", label: "On hold" },
  { value: "closed", label: "Closed" },
];

export default function JobFilters({ status, onStatusChange, search, onSearchChange }) {
  return (
    <div className="flex items-center justify-between gap-md flex-wrap mb-md">
      <div className="flex items-center gap-1 bg-surface-container-low rounded-lg p-1">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => onStatusChange(s.value)}
            className={`px-sm py-1 rounded text-body-sm transition-colors ${
              status === s.value ? "bg-paper text-on-surface shadow-sm" : "text-on-surface-variant"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <Icon name="search" size={16} className="absolute left-sm top-1/2 -translate-y-1/2 text-outline" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search jobs…"
          className="h-9 w-56 rounded border border-outline-variant/50 pl-8 pr-sm text-body-sm outline-none focus:border-prussian"
        />
      </div>
    </div>
  );
}
