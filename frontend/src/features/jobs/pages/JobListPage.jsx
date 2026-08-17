import { useNavigate } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Button from "../../../shared/components/Button.jsx";
import EmptyState from "../../../shared/components/EmptyState.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import JobCard from "../components/JobCard.jsx";
import JobFilters from "../components/JobFilters.jsx";
import { useJobListViewModel } from "../hooks/useJobListViewModel.js";

export default function JobListPage() {
  const navigate = useNavigate();
  const { jobs, isLoading, status, setStatus, search, setSearch } = useJobListViewModel();

  return (
    <div>
      <PageHeader
        title="Jobs"
        subtitle="Open requisitions and their ranking progress."
        actions={
          <Button leftIcon="add" onClick={() => navigate("/jobs/new")}>
            New job
          </Button>
        }
      />
      <JobFilters status={status} onStatusChange={setStatus} search={search} onSearchChange={setSearch} />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon="work"
          title="No jobs yet"
          description="Create your first requisition to start uploading and ranking resumes."
          actionLabel="Create a job"
          onAction={() => navigate("/jobs/new")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
