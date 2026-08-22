import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Input from "../../../shared/components/Input.jsx";
import Button from "../../../shared/components/Button.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import Modal from "../../../shared/components/Modal.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { formatDate } from "../../../shared/utils/format.js";
import { useDebounce } from "../../../shared/hooks/useDebounce.js";
import AdminTable from "../components/AdminTable.jsx";
import { useAdminCandidates } from "../hooks/useAdminManagement.js";

function statusBadge(c) {
  if (c.anonymizedAt) return <Badge tone="neutral">Anonymized</Badge>;
  return c.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Suspended</Badge>;
}

export default function AdminCandidatesPage() {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 300);
  const { items, total, isLoading, suspend, reactivate, anonymize } = useAdminCandidates(
    debounced ? { search: debounced } : {}
  );
  const [confirmAnon, setConfirmAnon] = useState(null);

  const columns = [
    { key: "fullName", label: "Name", render: (c) => <Link to={`/admin-panel/candidates/${c._id}`} className="text-prussian hover:underline">{c.fullName}</Link> },
    { key: "email", label: "Email" },
    { key: "status", label: "Status", render: statusBadge },
    { key: "createdAt", label: "Joined", render: (c) => formatDate(c.createdAt) },
    {
      key: "actions",
      label: "",
      render: (c) =>
        c.anonymizedAt ? null : (
          <div className="flex gap-xs justify-end">
            {c.isActive ? (
              <Button variant="ghost" size="sm" onClick={() => suspend(c._id)}>Suspend</Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => reactivate(c._id)}>Reactivate</Button>
            )}
            <Button variant="ghost" size="sm" className="!text-danger" onClick={() => setConfirmAnon(c)}>Anonymize</Button>
          </div>
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="Candidates" subtitle={total ? `${total} candidate account${total === 1 ? "" : "s"}` : "Platform-wide candidate accounts."} />
      <div className="mb-md max-w-sm">
        <Input leftIcon="search" placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {isLoading ? <SkeletonCard /> : <AdminTable columns={columns} rows={items} keyField="_id" empty="No candidates found." />}

      <Modal
        title="Anonymize candidate?"
        isOpen={Boolean(confirmAnon)}
        onClose={() => setConfirmAnon(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmAnon(null)}>Cancel</Button>
            <Button variant="danger" leftIcon="delete_forever" onClick={() => { anonymize(confirmAnon._id); setConfirmAnon(null); }}>
              Anonymize permanently
            </Button>
          </>
        }
      >
        <p className="text-body-md text-on-surface-variant">
          This permanently erases {confirmAnon?.fullName}&rsquo;s personal data and deletes their documents (GDPR erasure).
          The account record is kept for audit and referential integrity, but cannot be restored. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
