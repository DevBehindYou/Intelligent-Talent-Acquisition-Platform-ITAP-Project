import PageHeader from "../../../shared/components/PageHeader.jsx";
import MatchDial from "../../../shared/components/MatchDial.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { useComparisonViewModel } from "../hooks/useComparisonViewModel.js";

export default function ComparisonPage() {
  const { candidates, isLoading } = useComparisonViewModel();

  return (
    <div>
      <PageHeader title="Compare candidates" subtitle="Side-by-side view for a confident final call." />
      {isLoading ? (
        <SkeletonCard />
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-md min-w-fit">
            {candidates.map((c) => (
              <div key={c._id} className="w-72 flex-shrink-0 rounded-xl border border-outline-variant/40 bg-paper p-md flex flex-col gap-sm">
                <MatchDial score={c.bestMatchScore ?? 0} size="lg" />
                <p className="text-body-lg font-medium text-on-surface">{c.fullName}</p>
                <p className="text-body-sm text-on-surface-variant">{c.currentTitle}</p>
                <p className="text-body-sm text-on-surface-variant">{c.totalExperienceYears} yrs experience</p>
                <div className="flex flex-wrap gap-1 mt-sm">
                  {(c.skills ?? []).slice(0, 6).map((s) => (
                    <Badge key={s.name} tone="neutral">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
