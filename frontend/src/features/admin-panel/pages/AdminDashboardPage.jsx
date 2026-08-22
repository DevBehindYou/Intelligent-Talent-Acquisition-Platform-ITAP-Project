import PageHeader from "../../../shared/components/PageHeader.jsx";
import KpiCard from "../../../shared/components/KpiCard.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { useAdminDashboardViewModel } from "../hooks/useAdminDashboardViewModel.js";

function StatusBar({ label, count, max }) {
  return (
    <div className="flex items-center gap-sm">
      <span className="w-32 text-body-sm text-on-surface-variant capitalize">{label.replace("_", " ")}</span>
      <div className="flex-1 h-3 rounded bg-surface-container-high overflow-hidden">
        <div className="h-full bg-primary rounded" style={{ width: `${max ? (count / max) * 100 : 0}%` }} />
      </div>
      <span className="w-10 text-right text-body-sm text-on-surface">{count}</span>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { metrics, isLoading } = useAdminDashboardViewModel();
  if (isLoading || !metrics) return <SkeletonCard />;

  const { candidates, recruiters, recruitment, organizations, onboarding } = metrics;
  const statusEntries = Object.entries(recruitment.applicationsByStatus || {});
  const maxStatus = Math.max(1, ...statusEntries.map(([, c]) => c));

  return (
    <div>
      <PageHeader title="Platform overview" subtitle="Cross-organization metrics across the entire ITAP platform." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
        <KpiCard label="Organizations" value={organizations} icon="business" />
        <KpiCard label="Candidates" value={candidates.total} icon="group" />
        <KpiCard label="New (30d)" value={candidates.new30d} icon="person_add" />
        <KpiCard label="Recruiters" value={recruiters.total} icon="badge" />
        <KpiCard label="Open jobs" value={recruitment.openJobs} icon="work" />
        <KpiCard label="Applications" value={recruitment.totalApplications} icon="assignment" />
        <KpiCard label="Interviews" value={recruitment.interviews} icon="event" />
        <KpiCard label="Offers" value={recruitment.offers} icon="workspace_premium" />
        <KpiCard label="Hires" value={recruitment.hires} icon="verified" />
        <KpiCard label="Conversion" value={`${recruitment.conversionRate}%`} icon="trending_up" />
        <KpiCard label="Onboarding" value={onboarding.total} icon="assignment_turned_in" />
        <KpiCard label="Onboarded" value={onboarding.completed} icon="task_alt" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <div className="rounded-xl border border-outline-variant/40 bg-paper p-md">
          <h2 className="font-display-sm text-display-sm text-on-surface mb-md">Applications by stage</h2>
          {statusEntries.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">No applications yet.</p>
          ) : (
            <div className="flex flex-col gap-sm">
              {statusEntries.map(([status, count]) => (
                <StatusBar key={status} label={status} count={count} max={maxStatus} />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-outline-variant/40 bg-paper p-md">
          <h2 className="font-display-sm text-display-sm text-on-surface mb-md">Recruiters by role</h2>
          <div className="flex flex-col gap-sm">
            {Object.entries(recruiters.byRole || {}).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between text-body-md">
                <span className="text-on-surface-variant capitalize">{role.replace("_", " ")}</span>
                <span className="text-on-surface font-medium">{count}</span>
              </div>
            ))}
            {Object.keys(recruiters.byRole || {}).length === 0 && (
              <p className="text-body-sm text-on-surface-variant">No recruiters yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
