import clsx from "clsx";

const TONE_CLASSES = {
  neutral: "bg-surface-container-high text-on-surface-variant border-outline-variant/50",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-danger/10 text-danger border-danger/30",
  ai: "bg-brass/10 text-on-secondary-fixed border-brass/30", // reserved exclusively for AI-attributed content
  active: "bg-primary-fixed/30 text-on-primary-fixed-variant border-primary-fixed",
};

export default function Badge({ tone = "neutral", children, className = "", icon }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-1 rounded border font-label-caps text-label-caps",
        TONE_CLASSES[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
