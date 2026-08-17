import { useNavigate } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import KpiCard from "../../../shared/components/KpiCard.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import JobCard from "../../jobs/components/JobCard.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import { useDashboardViewModel } from "../hooks/useDashboardViewModel.js";

// Reproduces the Stitch "itap_dashboard" screen: 4 KPI cards, an Open Jobs list, and a
// Recent Activity feed. Content is role-scoped via the greeting + which jobs/activity the
// API returns for the current user, per docs/06 §1.2 ("Dashboard (role-scoped)").
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, summary, isLoadingSummary, jobs, isLoadingJobs } = useDashboardViewModel();

  const kpis = [
    { label: "Applications", value: summary?.applications ?? "—", icon: "description" },
    { label: "Shortlisted", value: summary?.shortlisted ?? "—", icon: "star" },
    { label: "Interviews", value: summary?.interviews ?? "—", icon: "event" },
    { label: "Avg. match", value: summary ? `${summary.avgMatchScore}%` : "—", icon: "speed" },
  ];

  return (
    <div>
      <PageHeader title={`Good to see you, ${user?.fullName?.split(" ")[0] || ""}`} subtitle="Here's what's moving across your pipeline." />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-md mb-lg">
        {isLoadingSummary
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-sm">
            <h2 className="font-display-sm text-display-sm text-on-surface">Open jobs</h2>
            <button onClick={() => navigate("/jobs")} className="text-body-sm text-prussian hover:underline">
              View all
            </button>
          </div>
          {isLoadingJobs ? (
            <SkeletonCard />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {jobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display-sm text-display-sm text-on-surface mb-sm">Recent activity</h2>
          <div className="rounded-xl border border-outline-variant/40 bg-paper divide-y divide-outline-variant/20">
            {(summary?.recentActivity ?? []).map((activity, i) => (
              <div key={i} className="flex items-start gap-sm p-sm">
                <Icon name={activity.icon || "circle"} size={16} className="text-outline mt-1" />
                <div>
                  <p className="text-body-sm text-on-surface">{activity.description}</p>
                  <p className="text-body-sm text-on-surface-variant">{activity.timeAgo}</p>
                </div>
              </div>
            ))}
            {(!summary?.recentActivity || summary.recentActivity.length === 0) && (
              <p className="text-body-sm text-on-surface-variant p-sm">No recent activity yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
