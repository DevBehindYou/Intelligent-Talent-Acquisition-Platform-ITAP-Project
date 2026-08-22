import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Input from "../../../shared/components/Input.jsx";
import Select from "../../../shared/components/Select.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import EmptyState from "../../../shared/components/EmptyState.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import { useDebounce } from "../../../shared/hooks/useDebounce.js";
import { useCandidateJobsViewModel } from "../hooks/useCandidateJobsViewModel.js";

const WORK_MODES = [
  { value: "", label: "Any location type" },
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
];
const EMPLOYMENT = [
  { value: "", label: "Any type" },
  { value: "full_time", label: "Full-time" },
  { value: "contract", label: "Contract" },
  { value: "remote", label: "Remote" },
];

export default function CandidateJobsPage() {
  const [search, setSearch] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const filters = {};
  if (debouncedSearch) filters.search = debouncedSearch;
  if (workMode) filters.workMode = workMode;
  if (employmentType) filters.employmentType = employmentType;

  const { jobs, total, isLoading } = useCandidateJobsViewModel(filters);

  return (
    <div>
      <PageHeader title="Open roles" subtitle={total ? `${total} open position${total === 1 ? "" : "s"}` : "Find your next role."} />

      <div className="flex flex-col md:flex-row gap-sm mb-lg">
        <div className="flex-1">
          <Input
            leftIcon="search"
            placeholder="Search by title or keyword"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={workMode} onChange={(e) => setWorkMode(e.target.value)} options={WORK_MODES} className="md:w-52" />
        <Select
          value={employmentType}
          onChange={(e) => setEmploymentType(e.target.value)}
          options={EMPLOYMENT}
          className="md:w-44"
        />
      </div>

      {isLoading ? (
        <SkeletonCard />
      ) : jobs.length === 0 ? (
        <EmptyState icon="work_off" title="No matching roles" description="Try clearing filters or a different keyword." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {jobs.map((job) => (
            <Link
              key={job._id}
              to={`/candidate/jobs/${job._id}`}
              className="rounded-xl border border-outline-variant/40 bg-paper p-md hover:border-primary/40 transition-colors flex flex-col gap-sm"
            >
              <div className="flex items-start justify-between gap-sm">
                <div>
                  <h3 className="font-display-sm text-display-sm text-on-surface">{job.title}</h3>
                  <p className="text-body-sm text-on-surface-variant">
                    {[job.company?.name, job.department].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <Icon name="chevron_right" className="text-outline mt-1" />
              </div>
              <div className="flex flex-wrap gap-xs">
                {job.location && <Badge icon={<Icon name="place" size={14} />}>{job.location}</Badge>}
                {job.workMode && <Badge tone="active">{job.workMode}</Badge>}
                {job.employmentType && <Badge>{job.employmentType.replace("_", " ")}</Badge>}
                {job.salaryRange?.min && (
                  <Badge tone="success">
                    {job.salaryRange.currency || "$"}
                    {job.salaryRange.min.toLocaleString()}
                    {job.salaryRange.max ? `–${job.salaryRange.max.toLocaleString()}` : "+"}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
