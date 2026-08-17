import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Breadcrumbs from "../../../shared/components/Breadcrumbs.jsx";
import Tabs from "../../../shared/components/Tabs.jsx";
import Button from "../../../shared/components/Button.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import RankingList from "../../candidates/components/RankingList.jsx";
import PipelineTable from "../../pipeline/components/PipelineTable.jsx";
import { useJobDetailViewModel } from "../hooks/useJobDetailViewModel.js";
import { useJobRankingsViewModel } from "../../matching/hooks/useJobRankingsViewModel.js";

const TABS = [
  { value: "rankings", label: "Ranked List" },
  { value: "pipeline", label: "Pipeline & Bulk Actions" },
];

export default function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("rankings");
  const { job, isLoading: isLoadingJob } = useJobDetailViewModel(jobId);
  const { rankings, isLoading, recompute, isRecomputing } = useJobRankingsViewModel(jobId);

  return (
    <div>
      <PageHeader
        breadcrumbs={<Breadcrumbs items={[{ label: "Jobs", to: "/jobs" }, { label: job?.title || "…" }]} />}
        title={job?.title || (isLoadingJob ? "Loading…" : "Job")}
        subtitle={job ? `${job.department} · ${job.location} · ${rankings.length} ranked` : undefined}
        actions={
          <>
            {job && <Badge tone={job.status === "open" ? "success" : "neutral"}>{job.status}</Badge>}
            <Button variant="secondary" leftIcon="tune" onClick={() => navigate(`/jobs/${jobId}/scoring`)}>
              Scoring weights
            </Button>
            <Button variant="secondary" leftIcon="upload" onClick={() => navigate(`/jobs/${jobId}/upload`)}>
              Upload resumes
            </Button>
            <Button leftIcon="refresh" isLoading={isRecomputing} onClick={() => recompute()}>
              Re-score all
            </Button>
          </>
        }
      />

      <div className="mb-md">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === "rankings" ? (
        <RankingList
          items={rankings}
          isLoading={isLoading}
          emptyState={{
            icon: "groups",
            title: "No candidates yet",
            description: "Upload resumes to start ranking candidates against this job.",
            actionLabel: "Upload resumes",
            onAction: () => navigate(`/jobs/${jobId}/upload`),
          }}
        />
      ) : (
        <PipelineTable jobId={jobId} />
      )}
    </div>
  );
}
