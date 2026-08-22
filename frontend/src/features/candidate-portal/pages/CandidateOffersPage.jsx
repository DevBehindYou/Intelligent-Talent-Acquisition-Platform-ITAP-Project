import { useState } from "react";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import Button from "../../../shared/components/Button.jsx";
import Modal from "../../../shared/components/Modal.jsx";
import EmptyState from "../../../shared/components/EmptyState.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { formatDate } from "../../../shared/utils/format.js";
import { useCandidateOffersViewModel } from "../hooks/useCandidateOffersViewModel.js";

const STATUS_TONE = { released: "active", accepted: "success", declined: "neutral", rescinded: "danger" };
const STATUS_LABEL = { released: "Awaiting your response", accepted: "Accepted", declined: "Declined", rescinded: "Withdrawn" };

function toOpenableUrl(url) {
  if (!url || url.startsWith("http")) return url;
  const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api").replace(/\/api\/?$/, "");
  return `${base}${url}`;
}

function Detail({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase">{label}</dt>
      <dd className="text-body-md text-on-surface">{value}</dd>
    </div>
  );
}

export default function CandidateOffersPage() {
  const { offers, isLoading, accept, isAccepting, decline, isDeclining, getDocumentUrl } =
    useCandidateOffersViewModel();
  const [confirm, setConfirm] = useState(null); // { offer, action }

  async function onDownload(offerId, index) {
    const url = await getDocumentUrl(offerId, index);
    window.open(toOpenableUrl(url), "_blank", "noopener");
  }

  function runConfirm() {
    if (!confirm) return;
    if (confirm.action === "accept") accept(confirm.offer.id);
    else decline(confirm.offer.id);
    setConfirm(null);
  }

  return (
    <div>
      <PageHeader title="Offers" subtitle="Review and respond to your job offers." />

      {isLoading ? (
        <SkeletonCard />
      ) : offers.length === 0 ? (
        <EmptyState icon="workspace_premium" title="No offers yet" description="Offers you receive will appear here." />
      ) : (
        <div className="flex flex-col gap-md">
          {offers.map((offer) => (
            <div key={offer.id} className="rounded-xl border border-outline-variant/40 bg-paper p-lg">
              <div className="flex items-start justify-between gap-md flex-wrap mb-md">
                <div>
                  <h2 className="font-display-md text-display-md text-on-surface">{offer.title || offer.job?.title}</h2>
                  <p className="text-body-sm text-on-surface-variant">{offer.job?.title}</p>
                </div>
                <Badge tone={STATUS_TONE[offer.status] || "neutral"}>{STATUS_LABEL[offer.status] || offer.status}</Badge>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-md mb-md">
                <Detail label="Compensation" value={offer.compensationSummary} />
                <Detail label="Start date" value={offer.startDate ? formatDate(offer.startDate) : null} />
                <Detail
                  label="Respond by"
                  value={offer.acceptanceDeadline ? formatDate(offer.acceptanceDeadline) : null}
                />
              </dl>

              {offer.instructions && <p className="text-body-md text-on-surface whitespace-pre-line mb-md">{offer.instructions}</p>}

              {offer.documents?.length > 0 && (
                <div className="flex flex-wrap gap-xs mb-md">
                  {offer.documents.map((doc) => (
                    <Button
                      key={doc.index}
                      variant="secondary"
                      size="sm"
                      leftIcon="download"
                      onClick={() => onDownload(offer.id, doc.index)}
                    >
                      {doc.name || `Document ${doc.index + 1}`}
                    </Button>
                  ))}
                </div>
              )}

              {offer.status === "released" ? (
                <div className="flex gap-sm">
                  <Button leftIcon="check" isLoading={isAccepting} onClick={() => setConfirm({ offer, action: "accept" })}>
                    Accept offer
                  </Button>
                  <Button
                    variant="secondary"
                    leftIcon="close"
                    isLoading={isDeclining}
                    onClick={() => setConfirm({ offer, action: "decline" })}
                  >
                    Decline
                  </Button>
                </div>
              ) : (
                offer.respondedAt && (
                  <p className="text-body-sm text-on-surface-variant flex items-center gap-xs">
                    <Icon name="history" size={16} /> Responded {formatDate(offer.respondedAt)}
                  </p>
                )
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        title={confirm?.action === "accept" ? "Accept this offer?" : "Decline this offer?"}
        isOpen={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant={confirm?.action === "accept" ? "primary" : "danger"}
              leftIcon={confirm?.action === "accept" ? "check" : "close"}
              onClick={runConfirm}
            >
              {confirm?.action === "accept" ? "Accept offer" : "Decline offer"}
            </Button>
          </>
        }
      >
        <p className="text-body-md text-on-surface-variant">
          {confirm?.action === "accept"
            ? "Accepting confirms your intent to join. The hiring team will be notified and next steps will follow."
            : "Declining removes you from this offer. This cannot be undone."}
        </p>
      </Modal>
    </div>
  );
}
