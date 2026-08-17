import { Link } from "react-router-dom";
import MatchDial from "../../../shared/components/MatchDial.jsx";
import StageTag from "../../../shared/components/StageTag.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import { SkeletonTable } from "../../../shared/components/Skeleton.jsx";
import EmptyState from "../../../shared/components/EmptyState.jsx";
import { formatDate } from "../../../shared/utils/format.js";

/**
 * Reproduces the ranked-list row layout from the Stitch dashboard export exactly:
 * 12-col grid, Match Dial + score-colored left border, candidate identity, stage chip,
 * applied date in mono, and a brass-tinted "AI Insight" cell with a lightbulb icon.
 * Reused on the job detail page and on talent search results (docs/06 §3.2, §3.5).
 */
export default function RankingList({ items, isLoading, emptyState }) {
  if (isLoading) return <SkeletonTable />;
  if (!isLoading && items.length === 0) return <EmptyState {...emptyState} />;

  return (
    <div className="rounded-xl border border-outline-variant/40 bg-paper overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-12 gap-gutter px-md py-sm hairline-b bg-surface-container-low">
          {["Match", "Candidate", "Stage", "Applied", "AI Insight"].map((label, i) => (
            <span
              key={label}
              className={`font-label-caps text-label-caps text-on-surface-variant uppercase ${
                [2, 3, 2, 2, 3][i] === 2 ? "col-span-2" : "col-span-3"
              }`}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="divide-y divide-outline-variant/20">
          {items.map((candidate) => (
            <Link
              to={`/candidates/${candidate.candidateId || candidate._id}`}
              key={candidate.candidateId || candidate._id}
              className="grid grid-cols-12 gap-gutter px-md py-md items-center hover:bg-surface transition-colors group"
            >
              <div className="col-span-2 flex items-center pl-sm">
                <MatchDial score={candidate.overallScore} size="md" />
              </div>
              <div className="col-span-3 flex flex-col justify-center border-l-[3px] border-secondary-fixed-dim pl-sm -ml-[3px]">
                <span className="text-body-md font-medium text-on-surface">{candidate.fullName}</span>
                <span className="text-body-sm text-on-surface-variant mt-xs">{candidate.currentTitle || "—"}</span>
              </div>
              <div className="col-span-2 flex items-center">
                <StageTag stage={candidate.stage || "shortlisted"} />
              </div>
              <div className="col-span-2 font-data-mono text-data-mono text-on-surface-variant flex items-center">
                {formatDate(candidate.appliedAt || candidate.createdAt)}
              </div>
              <div className="col-span-3 flex items-start ai-brass-bg p-sm rounded">
                <Icon name="lightbulb" size={14} className="text-secondary mr-xs mt-[2px]" />
                <span className="text-body-sm text-on-secondary-container leading-tight">
                  {candidate.reasonSummary || "Reasoning becomes available once scoring finishes."}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
