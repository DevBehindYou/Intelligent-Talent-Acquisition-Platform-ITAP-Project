import clsx from "clsx";

export function Skeleton({ className = "" }) {
  return <div className={clsx("animate-pulse rounded bg-surface-container-high", className)} />;
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-md py-sm px-md">
      <Skeleton className="w-8 h-8 rounded-full" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export function SkeletonTable({ rows = 6 }) {
  return (
    <div className="divide-y divide-outline-variant/30">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-outline-variant/40 p-md space-y-sm">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
