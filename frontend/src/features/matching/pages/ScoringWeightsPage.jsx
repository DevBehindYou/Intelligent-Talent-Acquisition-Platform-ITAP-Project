import { useParams } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Breadcrumbs from "../../../shared/components/Breadcrumbs.jsx";
import Button from "../../../shared/components/Button.jsx";
import WeightSliders from "../components/WeightSliders.jsx";
import { useScoringConfigViewModel } from "../hooks/useScoringConfigViewModel.js";

export default function ScoringWeightsPage() {
  const { jobId } = useParams();
  const { weights, updateWeight, save, isSaving } = useScoringConfigViewModel(jobId);
  const total = Object.values(weights).reduce((sum, v) => sum + v, 0);

  return (
    <div>
      <PageHeader
        breadcrumbs={<Breadcrumbs items={[{ label: "Jobs", to: "/jobs" }, { label: "Job", to: `/jobs/${jobId}` }, { label: "Scoring weights" }]} />}
        title="Scoring weights"
        subtitle="Adjust how much each factor contributes to this job's match score. Always sums to 100%."
      />
      <div className="max-w-md rounded-xl border border-outline-variant/40 bg-paper p-md">
        <WeightSliders weights={weights} onChange={updateWeight} />
        <p className="text-body-sm text-on-surface-variant mt-md">Total: {Math.round(total * 100)}%</p>
        <Button className="mt-md" isLoading={isSaving} onClick={() => save()}>
          Save & re-score
        </Button>
      </div>
    </div>
  );
}
