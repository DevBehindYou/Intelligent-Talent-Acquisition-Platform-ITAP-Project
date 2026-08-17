import clsx from "clsx";

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div role="tablist" className="flex items-center gap-md hairline-b">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={active === tab.value}
          onClick={() => onChange(tab.value)}
          className={clsx(
            "pb-sm px-1 text-body-md font-medium border-b-2 transition-colors -mb-px",
            active === tab.value
              ? "border-prussian text-prussian"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
