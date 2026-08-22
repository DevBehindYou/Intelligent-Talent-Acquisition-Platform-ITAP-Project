import PageHeader from "../../../shared/components/PageHeader.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { formatDate } from "../../../shared/utils/format.js";
import AdminTable from "../components/AdminTable.jsx";
import { useAdminOrganizations } from "../hooks/useAdminManagement.js";

export default function AdminOrganizationsPage() {
  const { items, total, isLoading } = useAdminOrganizations();

  const columns = [
    { key: "name", label: "Organization" },
    { key: "recruiters", label: "Recruiters" },
    { key: "jobs", label: "Jobs" },
    { key: "createdAt", label: "Created", render: (o) => formatDate(o.createdAt) },
  ];

  return (
    <div>
      <PageHeader title="Organizations" subtitle={total ? `${total} tenant organization${total === 1 ? "" : "s"}` : "All tenant organizations."} />
      {isLoading ? <SkeletonCard /> : <AdminTable columns={columns} rows={items} empty="No organizations." />}
    </div>
  );
}
