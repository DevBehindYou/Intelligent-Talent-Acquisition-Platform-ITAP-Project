import { SkeletonCard } from "./Skeleton.jsx";

// Suspense fallback for lazy-loaded route chunks (see app/routes.jsx). Deliberately quiet —
// a skeleton, not a spinner — consistent with docs/05-ui-ux-design-system.md §8's loading-state
// guidance ("skeleton shimmer for content, spinner only inside buttons").
export default function PageLoadingFallback() {
  return (
    <div className="p-lg">
      <SkeletonCard />
    </div>
  );
}
