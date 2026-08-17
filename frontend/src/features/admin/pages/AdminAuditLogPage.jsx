import { useQuery } from "@tanstack/react-query";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import { SkeletonTable } from "../../../shared/components/Skeleton.jsx";
import EmptyState from "../../../shared/components/EmptyState.jsx";
import { formatDate } from "../../../shared/utils/format.js";
import { adminApi } from "../services/adminApi.js";

export default function AdminAuditLogPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "audit-logs"], queryFn: () => adminApi.auditLogs() });
  const logs = data?.items ?? [];

  return (
    <div>
      <PageHeader title="Audit log" subtitle="Every read of candidate data, scoring change, and role change, with actor and timestamp." />
      {isLoading ? (
        <SkeletonTable />
      ) : logs.length === 0 ? (
        <EmptyState icon="fact_check" title="No audit events yet" description="Actions across your organization will be recorded here." />
      ) : (
        <div className="rounded-xl border border-outline-variant/40 bg-paper overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-12 gap-gutter px-md py-sm hairline-b bg-surface-container-low font-label-caps text-label-caps text-on-surface-variant uppercase">
              <span className="col-span-3">Actor</span>
              <span className="col-span-3">Action</span>
              <span className="col-span-3">Target</span>
              <span className="col-span-3">When</span>
            </div>
            <div className="divide-y divide-outline-variant/20">
              {logs.map((log) => (
                <div key={log._id} className="grid grid-cols-12 gap-gutter px-md py-sm items-center">
                  <span className="col-span-3 text-body-sm text-on-surface">{log.actorName}</span>
                  <span className="col-span-3 text-body-sm text-on-surface-variant">{log.action}</span>
                  <span className="col-span-3 text-body-sm text-on-surface-variant">{log.targetType}</span>
                  <span className="col-span-3 font-data-mono text-data-mono text-on-surface-variant">{formatDate(log.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
