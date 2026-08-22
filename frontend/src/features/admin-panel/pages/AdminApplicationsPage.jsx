import { useState } from "react";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Select from "../../../shared/components/Select.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { formatDate } from "../../../shared/utils/format.js";
import AdminTable from "../components/AdminTable.jsx";
import { useAdminApplications } from "../hooks/useAdminManagement.js";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  ...["applied", "screened", "shortlisted", "interviewing", "offer", "hired", "rejected", "withdrawn"].map((s) => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  })),
];

export default function AdminApplicationsPage() {
  const [status, setStatus] = useState("");
  const { items, total, isLoading } = useAdminApplications(status ? { status } : {});

  const columns = [
    { key: "candidate", label: "Candidate" },
    { key: "job", label: "Role" },
    { key: "organization", label: "Organization" },
    { key: "status", label: "Status", render: (a) => <Badge>{a.status}</Badge> },
    { key: "submittedAt", label: "Applied", render: (a) => formatDate(a.submittedAt) },
  ];

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle={total ? `${total} application${total === 1 ? "" : "s"} across all organizations` : "All applications across the platform."}
        actions={<Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS} className="!w-48" />}
      />
      {isLoading ? <SkeletonCard /> : <AdminTable columns={columns} rows={items} empty="No applications." />}
    </div>
  );
}
