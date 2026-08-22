import { useState } from "react";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Input from "../../../shared/components/Input.jsx";
import Button from "../../../shared/components/Button.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { formatDate } from "../../../shared/utils/format.js";
import { useDebounce } from "../../../shared/hooks/useDebounce.js";
import AdminTable from "../components/AdminTable.jsx";
import { useAdminRecruiters } from "../hooks/useAdminManagement.js";

export default function AdminRecruitersPage() {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 300);
  const { items, total, isLoading, activate, deactivate } = useAdminRecruiters(debounced ? { search: debounced } : {});

  const columns = [
    { key: "fullName", label: "Name" },
    { key: "email", label: "Email" },
    { key: "organization", label: "Organization" },
    { key: "role", label: "Role", render: (u) => <span className="capitalize">{(u.role || "").replace("_", " ")}</span> },
    { key: "isActive", label: "Status", render: (u) => (u.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Disabled</Badge>) },
    { key: "lastLoginAt", label: "Last login", render: (u) => (u.lastLoginAt ? formatDate(u.lastLoginAt) : "—") },
    {
      key: "actions",
      label: "",
      render: (u) => (
        <div className="flex justify-end">
          {u.isActive ? (
            <Button variant="ghost" size="sm" className="!text-danger" onClick={() => deactivate(u.id)}>Deactivate</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => activate(u.id)}>Activate</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Recruiters & HR" subtitle={total ? `${total} staff account${total === 1 ? "" : "s"} across all organizations` : "Staff accounts across the platform."} />
      <div className="mb-md max-w-sm">
        <Input leftIcon="search" placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {isLoading ? <SkeletonCard /> : <AdminTable columns={columns} rows={items} empty="No staff found." />}
    </div>
  );
}
