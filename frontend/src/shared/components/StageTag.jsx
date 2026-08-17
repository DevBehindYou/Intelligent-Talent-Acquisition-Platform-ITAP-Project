import clsx from "clsx";

export const PIPELINE_STAGES = [
  "applied",
  "screened",
  "shortlisted",
  "interviewing",
  "offer",
  "hired",
  "rejected",
];

const STAGE_CLASSES = {
  applied: "bg-surface-container-high text-on-surface-variant border-outline-variant/50",
  screened: "bg-surface-container-high text-on-surface-variant border-outline-variant/50",
  shortlisted: "bg-secondary-fixed/30 text-on-secondary-fixed-variant border-secondary-fixed",
  interviewing: "bg-primary-fixed/30 text-on-primary-fixed-variant border-primary-fixed",
  offer: "bg-tertiary-fixed/40 text-on-tertiary-fixed-variant border-tertiary-fixed",
  hired: "bg-success/10 text-success border-success/30",
  rejected: "bg-danger/10 text-danger border-danger/30",
};

const STAGE_LABELS = {
  applied: "Applied",
  screened: "Screened",
  shortlisted: "AI Shortlist",
  interviewing: "Interviewing",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

export default function StageTag({ stage }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-1 rounded font-label-caps text-label-caps border",
        STAGE_CLASSES[stage] || STAGE_CLASSES.applied
      )}
    >
      {STAGE_LABELS[stage] || stage}
    </span>
  );
}
