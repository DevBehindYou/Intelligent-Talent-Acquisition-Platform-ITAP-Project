import { Link } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Button from "../../../shared/components/Button.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import Avatar from "../../../shared/components/Avatar.jsx";
import MatchDial from "../../../shared/components/MatchDial.jsx";
import EmptyState from "../../../shared/components/EmptyState.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { useTalentPoolsViewModel } from "../hooks/useTalentPoolsViewModel.js";

const STATUS_LABEL = { active_sourcing: "ACTIVE SOURCING", passive_growing: "PASSIVE / GROWING" };

/**
 * Reproduces the "talent_pool_sourcing_management" screen: bento card grid, an "AI Health
 * Dial" per pool (the same MatchDial component reused as a pool-health gauge rather than a
 * candidate score — docs/design-reference/talent_pool_sourcing_management), a sourcing
 * status pill, an AI summary line, and a stacked avatar row of top matches.
 */
export default function TalentPoolsPage() {
  const { pools, isLoading } = useTalentPoolsViewModel();

  return (
    <div>
      <PageHeader
        title="Talent Pools"
        subtitle="Manage and monitor curated candidate segments."
        actions={
          <Button leftIcon="add" onClick={() => {}}>
            Create New Pool
          </Button>
        }
      />
      {isLoading ? (
        <SkeletonCard />
      ) : pools.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="No talent pools yet"
          description="Save a Talent Search as a pool to revisit and monitor it over time."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
          {pools.map((pool) => (
            <div
              key={pool._id}
              className="rounded-lg p-md flex flex-col relative shadow-sm border border-outline-variant/30 bg-paper"
              style={pool.sourcingStatus === "active_sourcing" ? { borderLeft: "3px solid #f8bc5e" } : undefined}
            >
              <div className="flex justify-between items-start mb-md gap-sm">
                <div>
                  <h2 className="font-display-sm text-display-sm text-on-surface mb-1">{pool.name}</h2>
                  <div className="flex items-center gap-1 font-data-mono text-data-mono text-on-surface-variant">
                    <Icon name="groups" size={14} />
                    {pool.candidateCount} Candidates
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded text-label-caps font-label-caps flex items-center gap-1 flex-shrink-0 ${
                    pool.sourcingStatus === "active_sourcing"
                      ? "bg-surface-container-highest text-on-surface"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {pool.sourcingStatus === "active_sourcing" && <span className="w-1.5 h-1.5 rounded-full bg-secondary-container" />}
                  {STATUS_LABEL[pool.sourcingStatus]}
                </div>
              </div>

              <div className="flex gap-md mb-md">
                <MatchDial score={pool.healthScore} size="lg" />
                <div className="flex-1 flex flex-col justify-center">
                  <div
                    className={`p-sm rounded text-body-sm border ${
                      pool.healthScore >= 80
                        ? "bg-brass/5 border-brass/20 text-on-surface-variant"
                        : "bg-surface-container-low border-outline-variant/10 text-on-surface-variant"
                    }`}
                  >
                    {pool.healthScore >= 80 && <strong className="text-secondary">AI Summary: </strong>}
                    {pool.aiSummary}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-sm border-t border-outline-variant/20 flex items-center justify-between">
                <span className="text-body-sm text-on-surface-variant">Top Matches</span>
                <div className="flex -space-x-2 items-center">
                  {pool.topMatches?.map((m) => (
                    <span key={m.candidateId} className="border border-white rounded-full" title={m.fullName}>
                      <Avatar name={m.fullName} size={24} />
                    </span>
                  ))}
                  {pool.candidateCount > (pool.topMatches?.length || 0) && (
                    <div className="w-6 h-6 rounded-full border border-white bg-surface-container-highest flex items-center justify-center font-data-mono text-[9px] text-on-surface-variant">
                      +{pool.candidateCount - (pool.topMatches?.length || 0)}
                    </div>
                  )}
                </div>
              </div>

              <Link
                to={`/talent-search?q=${encodeURIComponent(pool.query)}`}
                className="text-body-sm text-prussian hover:underline mt-sm"
              >
                Open in Talent Search
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
