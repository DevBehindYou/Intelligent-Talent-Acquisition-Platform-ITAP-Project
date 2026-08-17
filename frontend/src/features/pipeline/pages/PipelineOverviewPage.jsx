import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Select from "../../../shared/components/Select.jsx";
import EmptyState from "../../../shared/components/EmptyState.jsx";
import PipelineTable from "../components/PipelineTable.jsx";
import { jobsApi } from "../../jobs/services/jobsApi.js";

export default function PipelineOverviewPage() {
  const [jobId, setJobId] = useState("");
  const { data } = useQuery({ queryKey: ["jobs", { status: "open" }], queryFn: () => jobsApi.list({ status: "open" }) });
  const jobs = data?.items ?? [];

  // Depend on the stable primitive id, not the freshly-allocated `jobs` array, so the
  // effect doesn't re-run on every render (react-hooks/exhaustive-deps).
  const firstJobId = jobs[0]?._id;
  useEffect(() => {
    if (!jobId && firstJobId) setJobId(firstJobId);
  }, [firstJobId, jobId]);

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle="Bulk-review and move candidates across stages for a job."
        actions={
          jobs.length > 0 && (
            <Select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              options={jobs.map((j) => ({ value: j._id, label: j.title }))}
              className="!w-64"
            />
          )
        }
      />
      {jobId ? (
        <PipelineTable jobId={jobId} />
      ) : (
        <EmptyState icon="account_tree" title="No open jobs" description="Open a job requisition to manage its pipeline here." />
      )}
    </div>
  );
}
