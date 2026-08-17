import Icon from "../../../shared/components/Icon.jsx";

export default function FilterBar({ search, onSearchChange }) {
  return (
    <div className="flex items-center gap-sm mb-md">
      <div className="relative flex-1 max-w-md">
        <Icon name="search" size={16} className="absolute left-sm top-1/2 -translate-y-1/2 text-outline" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, skill, title…"
          className="w-full h-9 rounded border border-outline-variant/50 pl-8 pr-sm text-body-sm outline-none focus:border-prussian"
        />
      </div>
    </div>
  );
}
