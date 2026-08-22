import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import Button from "../../../shared/components/Button.jsx";
import Modal from "../../../shared/components/Modal.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { formatDate } from "../../../shared/utils/format.js";
import AdminTable from "../components/AdminTable.jsx";
import { useAdminCandidateDetail } from "../hooks/useAdminManagement.js";

export default function AdminCandidateDetailPage() {
  const { id } = useParams();
  const { candidate, isLoading, suspend, reactivate, anonymize } = useAdminCandidateDetail(id);
  const [confirmAnon, setConfirmAnon] = useState(false);

  if (isLoading) return <SkeletonCard />;
  if (!candidate) return <p className="text-body-md text-on-surface-variant">Candidate not found.</p>;

  const anonymized = Boolean(candidate.anonymizedAt);

  return (
    <div>
      <PageHeader
        title={candidate.fullName}
        subtitle={candidate.email}
        breadcrumbs={
          <Link to="/admin-panel/candidates" className="text-body-sm text-prussian hover:underline inline-flex items-center gap-xs">
            <Icon name="arrow_back" size={16} /> Candidates
          </Link>
        }
        actions={
          anonymized ? (
            <Badge tone="neutral">Anonymized {formatDate(candidate.anonymizedAt)}</Badge>
          ) : (
            <div className="flex gap-sm">
              {candidate.isActive ? (
                <Button variant="secondary" size="sm" leftIcon="block" onClick={() => suspend()}>Suspend</Button>
              ) : (
                <Button variant="secondary" size="sm" leftIcon="check" onClick={() => reactivate()}>Reactivate</Button>
              )}
              <Button variant="danger" size="sm" leftIcon="delete_forever" onClick={() => setConfirmAnon(true)}>Anonymize</Button>
            </div>
          )
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
        <Meta label="Status" value={anonymized ? "Anonymized" : candidate.isActive ? "Active" : "Suspended"} />
        <Meta label="Location" value={candidate.location} />
        <Meta label="Joined" value={formatDate(candidate.createdAt)} />
        <Meta label="Last login" value={candidate.lastLoginAt ? formatDate(candidate.lastLoginAt) : "—"} />
      </div>

      <h2 className="font-display-sm text-display-sm text-on-surface mb-sm">Applications</h2>
      <AdminTable
        columns={[
          { key: "job", label: "Role" },
          { key: "organization", label: "Organization" },
          { key: "status", label: "Status", render: (a) => <Badge>{a.status}</Badge> },
          { key: "submittedAt", label: "Applied", render: (a) => formatDate(a.submittedAt) },
        ]}
        rows={candidate.applications || []}
        empty="No applications."
      />

      <Modal
        title="Anonymize candidate?"
        isOpen={confirmAnon}
        onClose={() => setConfirmAnon(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmAnon(false)}>Cancel</Button>
            <Button variant="danger" leftIcon="delete_forever" onClick={() => { anonymize(); setConfirmAnon(false); }}>
              Anonymize permanently
            </Button>
          </>
        }
      >
        <p className="text-body-md text-on-surface-variant">
          This permanently erases the candidate&rsquo;s personal data and deletes their documents. The record is kept for
          audit but cannot be restored.
        </p>
      </Modal>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div className="rounded-xl border border-outline-variant/40 bg-paper p-md">
      <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">{label}</p>
      <p className="text-body-md text-on-surface">{value || "—"}</p>
    </div>
  );
}
