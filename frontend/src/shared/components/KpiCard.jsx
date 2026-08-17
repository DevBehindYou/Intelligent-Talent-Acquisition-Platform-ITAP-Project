import Icon from "./Icon.jsx";
import clsx from "clsx";

export default function KpiCard({ label, value, delta, deltaDirection = "up", icon }) {
  return (
    <div className="rounded-xl border border-outline-variant/40 bg-paper p-md flex flex-col gap-xs">
      <div className="flex items-center justify-between">
        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">{label}</span>
        {icon && <Icon name={icon} size={18} className="text-outline" />}
      </div>
      <span className="font-data-mono text-display-md text-on-surface">{value}</span>
      {delta && (
        <span
          className={clsx(
            "inline-flex items-center gap-1 text-body-sm font-medium w-fit",
            deltaDirection === "up" ? "text-success" : "text-danger"
          )}
        >
          <Icon name={deltaDirection === "up" ? "trending_up" : "trending_down"} size={14} />
          {delta}
        </span>
      )}
    </div>
  );
}
