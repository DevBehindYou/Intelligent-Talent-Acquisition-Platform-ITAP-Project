import PageHeader from "../../../shared/components/PageHeader.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { formatDate } from "../../../shared/utils/format.js";
import AdminTable from "../components/AdminTable.jsx";
import { useAdminAuditLogs } from "../hooks/useAdminManagement.js";

function actionTone(action = "") {
  if (action.includes("anonymized") || action.includes("deactivated") || action.includes("suspended")) return "danger";
  if (action.includes("activated") || action.includes("reactivated")) return "success";
  return "neutral";
}

export default function AdminAuditLogPage() {
  const { items, total, isLoading } = useAdminAuditLogs();

  const columns = [
    { key: "createdAt", label: "When", render: (l) => formatDate(l.createdAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) },
    { key: "action", label: "Action", render: (l) => <Badge tone={actionTone(l.action)}>{l.action}</Badge> },
    { key: "targetType", label: "Target", render: (l) => `${l.targetType || "—"}` },
    { key: "actor", label: "Actor", render: (l) => l.metadata?.actorType || "system" },
  ];

  return (
    <div>
      <PageHeader title="Audit log" subtitle={total ? `${total} recorded event${total === 1 ? "" : "s"}` : "Platform administrator activity."} />
      {isLoading ? <SkeletonCard /> : <AdminTable columns={columns} rows={items} keyField="_id" empty="No audit entries yet." />}
    </div>
  );
}
