import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import Button from "../../../shared/components/Button.jsx";
import Modal from "../../../shared/components/Modal.jsx";
import Textarea from "../../../shared/components/Textarea.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { formatDate } from "../../../shared/utils/format.js";
import { useCandidateApplicationDetailViewModel } from "../hooks/useCandidateApplicationsViewModel.js";
import { candidateConversationsApi } from "../services/candidateApi.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";
import { statusTone } from "../lib/applicationStatus.js";

const STATUS_LABEL = {
  applied: "Applied",
  screened: "Under Review",
  shortlisted: "Shortlisted",
  interviewing: "Interview Stage",
  offer: "Offer",
  hired: "Hired",
  rejected: "Not Selected",
  withdrawn: "Withdrawn",
};

function eventLabel(event) {
  if (event.type === "submitted") return "Application submitted";
  if (event.type === "withdrawn") return "Application withdrawn";
  if (event.type === "status_changed") return `Moved to ${STATUS_LABEL[event.toStatus] || event.toStatus}`;
  if (event.type === "interview_scheduled") return "Interview scheduled";
  return event.type.replace(/_/g, " ");
}

const CAN_WITHDRAW = (status) => !["hired", "rejected", "withdrawn"].includes(status);

export default function CandidateApplicationDetailPage() {
  const { applicationId } = useParams();
  const { application, timeline, isLoading, withdraw, isWithdrawing } =
    useCandidateApplicationDetailViewModel(applicationId);
  const navigate = useNavigate();
  const pushToast = useNotificationsStore((s) => s.pushToast);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgDraft, setMsgDraft] = useState("");

  const startMessage = useMutation({
    mutationFn: (body) => candidateConversationsApi.start({ applicationId, body }),
    onSuccess: () => {
      setMsgOpen(false);
      setMsgDraft("");
      pushToast({ tone: "success", message: "Message sent to the hiring team." });
      navigate("/candidate/messages");
    },
    onError: (err) => {
      pushToast({ tone: "danger", message: err?.response?.data?.error?.message || "Could not send message." });
    },
  });

  if (isLoading) return <SkeletonCard />;
  if (!application) {
    return (
      <div className="text-center py-2xl">
        <p className="text-body-md text-on-surface-variant">Application not found.</p>
        <Button as={Link} to="/candidate/applications" variant="secondary" size="sm" className="mt-md">
          Back to applications
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={application.job?.title || "Application"}
        subtitle={application.job?.location}
        breadcrumbs={
          <Link
            to="/candidate/applications"
            className="text-body-sm text-prussian hover:underline inline-flex items-center gap-xs"
          >
            <Icon name="arrow_back" size={16} /> My applications
          </Link>
        }
        actions={
          <>
            <Button variant="secondary" size="sm" leftIcon="chat" onClick={() => setMsgOpen(true)}>
              Message hiring team
            </Button>
            {CAN_WITHDRAW(application.status) && (
              <Button variant="danger" size="sm" leftIcon="cancel" onClick={() => setConfirmOpen(true)}>
                Withdraw
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Status + meta */}
        <div className="rounded-xl border border-outline-variant/40 bg-paper p-md h-fit">
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-xs">Current status</p>
          <Badge tone={statusTone(application.status)} className="mb-md">
            {application.statusLabel}
          </Badge>
          <dl className="flex flex-col gap-sm mt-sm">
            <div className="flex justify-between text-body-sm">
              <dt className="text-on-surface-variant">Applied</dt>
              <dd className="text-on-surface">{formatDate(application.submittedAt)}</dd>
            </div>
            {application.withdrawnAt && (
              <div className="flex justify-between text-body-sm">
                <dt className="text-on-surface-variant">Withdrawn</dt>
                <dd className="text-on-surface">{formatDate(application.withdrawnAt)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-2">
          <h2 className="font-display-sm text-display-sm text-on-surface mb-md">Progress</h2>
          <ol className="relative border-l border-outline-variant/50 ml-2">
            {timeline.length === 0 && <li className="ml-md text-body-sm text-on-surface-variant">No updates yet.</li>}
            {timeline.map((event, i) => (
              <li key={event._id || i} className="ml-md mb-lg last:mb-0">
                <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-primary border-2 border-paper" />
                <p className="text-body-md text-on-surface">{eventLabel(event)}</p>
                <p className="text-body-sm text-on-surface-variant">{formatDate(event.createdAt)}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <Modal
        title="Withdraw application?"
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              isLoading={isWithdrawing}
              onClick={() => {
                withdraw();
                setConfirmOpen(false);
              }}
            >
              Withdraw
            </Button>
          </>
        }
      >
        <p className="text-body-md text-on-surface-variant">
          This removes your application from consideration. You can re-apply later while the role is open.
        </p>
      </Modal>

      <Modal
        title="Message the hiring team"
        isOpen={msgOpen}
        onClose={() => setMsgOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setMsgOpen(false)}>
              Cancel
            </Button>
            <Button
              leftIcon="send"
              isLoading={startMessage.isPending}
              disabled={!msgDraft.trim()}
              onClick={() => startMessage.mutate(msgDraft.trim())}
            >
              Send
            </Button>
          </>
        }
      >
        <Textarea
          label="Your message"
          rows={4}
          value={msgDraft}
          onChange={(e) => setMsgDraft(e.target.value)}
          placeholder="Ask a question or share an update about this application…"
        />
      </Modal>
    </div>
  );
}
