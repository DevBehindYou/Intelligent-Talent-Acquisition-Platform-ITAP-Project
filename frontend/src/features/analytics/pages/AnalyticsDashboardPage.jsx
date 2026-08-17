import PageHeader from "../../../shared/components/PageHeader.jsx";
import KpiCard from "../../../shared/components/KpiCard.jsx";
import FunnelChart from "../components/FunnelChart.jsx";
import MatchDistributionChart from "../components/MatchDistributionChart.jsx";
import TopSourcesChart from "../components/TopSourcesChart.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { useAnalyticsViewModel } from "../hooks/useAnalyticsViewModel.js";

// Reproduces the Stitch "reporting_analytics" screen: Hiring Funnel Velocity, Match
// Distribution, and Top Sources (Yield) — docs/06 §1.5, docs/03-api-documentation.md §10.
export default function AnalyticsDashboardPage() {
  const { summary, skillDemand, isLoading } = useAnalyticsViewModel();

  if (isLoading) return <SkeletonCard />;

  return (
    <div>
      <PageHeader title="Reporting & Analytics" subtitle="Time-to-hire, funnel health, and where your best candidates come from." />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-md mb-lg">
        <KpiCard label="Time to screen" value={summary?.timeToScreen ?? "—"} icon="timer" />
        <KpiCard label="Time to hire" value={summary?.timeToHire ?? "—"} icon="event_available" />
        <KpiCard label="Offer acceptance" value={summary ? `${summary.offerAcceptanceRate}%` : "—"} icon="handshake" />
        <KpiCard label="Interview conversion" value={summary ? `${summary.interviewConversion}%` : "—"} icon="trending_up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <div className="rounded-xl border border-outline-variant/40 bg-paper p-md">
          <h2 className="font-display-sm text-display-sm text-on-surface mb-sm">Hiring Funnel Velocity</h2>
          <FunnelChart data={summary?.funnel ?? []} />
        </div>
        <div className="rounded-xl border border-outline-variant/40 bg-paper p-md">
          <h2 className="font-display-sm text-display-sm text-on-surface mb-sm">Match Distribution</h2>
          <MatchDistributionChart data={summary?.matchDistribution ?? []} />
        </div>
        <div className="rounded-xl border border-outline-variant/40 bg-paper p-md lg:col-span-2">
          <h2 className="font-display-sm text-display-sm text-on-surface mb-sm">Top Sources (Yield)</h2>
          <TopSourcesChart data={summary?.topSources ?? []} />
        </div>
        <div className="rounded-xl border border-outline-variant/40 bg-paper p-md lg:col-span-2">
          <h2 className="font-display-sm text-display-sm text-on-surface mb-sm">Skill demand across open jobs</h2>
          <div className="flex flex-wrap gap-2">
            {skillDemand.map((s) => (
              <span key={s.skill} className="px-sm py-1 rounded-full bg-surface-container-high text-body-sm text-on-surface-variant">
                {s.skill} · {s.count}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
