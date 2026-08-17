import { useNavigate } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Button from "../../../shared/components/Button.jsx";
import MatchDial from "../../../shared/components/MatchDial.jsx";
import EmptyState from "../../../shared/components/EmptyState.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { useShortlistsViewModel } from "../hooks/useShortlistsViewModel.js";

export default function ShortlistsPage() {
  const navigate = useNavigate();
  const { candidates, isLoading, selected, toggle } = useShortlistsViewModel();

  return (
    <div>
      <PageHeader
        title="My Shortlists"
        subtitle="Candidates shared with you for review. Select up to 4 to compare."
        actions={
          selected.length > 1 && (
            <Button leftIcon="compare_arrows" onClick={() => navigate(`/shortlists/compare?ids=${selected.join(",")}`)}>
              Compare {selected.length}
            </Button>
          )
        }
      />
      {isLoading ? (
        <SkeletonCard />
      ) : candidates.length === 0 ? (
        <EmptyState icon="star" title="No shortlisted candidates yet" description="Recruiters will share candidates with you here as they're shortlisted." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
          {candidates.map((c) => (
            <div
              key={c._id}
              onClick={() => toggle(c._id)}
              className={`rounded-xl border p-md cursor-pointer transition-colors ${
                selected.includes(c._id) ? "border-prussian bg-prussian/5" : "border-outline-variant/40 hover:border-prussian/40"
              }`}
            >
              <div className="flex items-center gap-sm">
                <MatchDial score={c.bestMatchScore ?? 0} size="md" />
                <div>
                  <p className="text-body-md font-medium text-on-surface">{c.fullName}</p>
                  <p className="text-body-sm text-on-surface-variant">{c.currentTitle}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="mt-sm w-full" onClick={(e) => (e.stopPropagation(), navigate(`/candidates/${c._id}`))}>
                View profile
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
