import { Link } from "react-router-dom";
import Badge from "../../../shared/components/Badge.jsx";
import Icon from "../../../shared/components/Icon.jsx";

const STATUS_TONE = { open: "success", draft: "neutral", on_hold: "warning", closed: "danger" };

export default function JobCard({ job }) {
  const rankedPct = job.totalApplicants ? Math.round((job.rankedCount / job.totalApplicants) * 100) : 0;
  return (
    <Link
      to={`/jobs/${job._id}`}
      className="block rounded-xl border border-outline-variant/40 bg-paper p-md hover:border-prussian transition-colors"
    >
      <div className="flex items-start justify-between gap-sm">
        <div>
          <p className="text-body-lg font-medium text-on-surface">{job.title}</p>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {job.department} · {job.location}
          </p>
        </div>
        <Badge tone={STATUS_TONE[job.status] || "neutral"}>{job.status?.replace("_", " ")}</Badge>
      </div>

      <div className="mt-md">
        <div className="flex items-center justify-between text-body-sm text-on-surface-variant mb-1">
          <span>
            {job.rankedCount ?? 0}/{job.totalApplicants ?? 0} ranked
          </span>
          <span>{rankedPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
          <div className="h-full bg-prussian rounded-full" style={{ width: `${rankedPct}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-1 mt-sm text-body-sm text-on-surface-variant">
        <Icon name="groups" size={16} />
        {job.totalApplicants ?? 0} applicants
      </div>
    </Link>
  );
}
