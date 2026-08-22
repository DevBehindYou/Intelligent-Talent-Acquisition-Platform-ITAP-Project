import { useRef, useState } from "react";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import Button from "../../../shared/components/Button.jsx";
import Modal from "../../../shared/components/Modal.jsx";
import Textarea from "../../../shared/components/Textarea.jsx";
import EmptyState from "../../../shared/components/EmptyState.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { formatDate } from "../../../shared/utils/format.js";
import { useCandidateOnboardingViewModel } from "../hooks/useCandidateOnboardingViewModel.js";

const STATUS_TONE = { pending: "neutral", submitted: "active", approved: "success", rejected: "danger" };
const STATUS_LABEL = { pending: "To do", submitted: "Submitted", approved: "Approved", rejected: "Action needed" };
const TYPE_ICON = { document: "upload_file", form: "edit_note", acknowledgement: "verified", info: "info" };
const NEEDS_ACTION = (status) => status === "pending" || status === "rejected";

export default function CandidateOnboardingPage() {
  const { cases, isLoading, submitForm, acknowledge, submitDocument, isBusy } = useCandidateOnboardingViewModel();
  const [formTask, setFormTask] = useState(null);
  const [details, setDetails] = useState("");
  const fileRef = useRef(null);
  const docTaskId = useRef(null);

  function pickDocument(taskId) {
    docTaskId.current = taskId;
    fileRef.current?.click();
  }
  function onFilePicked(e) {
    const file = e.target.files?.[0];
    if (file && docTaskId.current) submitDocument({ taskId: docTaskId.current, file });
    e.target.value = "";
  }
  function submitFormTask() {
    submitForm({ taskId: formTask.id, details: details.trim() });
    setFormTask(null);
    setDetails("");
  }

  if (isLoading) return <SkeletonCard />;

  return (
    <div>
      <PageHeader title="Onboarding" subtitle="Complete these steps to get ready for your first day." />

      <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={onFilePicked} />

      {cases.length === 0 ? (
        <EmptyState
          icon="assignment_turned_in"
          title="No onboarding yet"
          description="Once you accept an offer and are hired, your onboarding checklist will appear here."
        />
      ) : (
        <div className="flex flex-col gap-lg">
          {cases.map((c) => (
            <div key={c.id} className="rounded-xl border border-outline-variant/40 bg-paper p-lg">
              <div className="flex items-start justify-between gap-md flex-wrap mb-md">
                <div>
                  <h2 className="font-display-md text-display-md text-on-surface">{c.job?.title || "Onboarding"}</h2>
                  {c.joiningDate && (
                    <p className="text-body-sm text-on-surface-variant flex items-center gap-xs mt-1">
                      <Icon name="event" size={16} /> Joining {formatDate(c.joiningDate)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-display-sm font-display-sm text-primary">{c.progressPct}%</span>
                  <p className="text-body-sm text-on-surface-variant">{c.outstanding} outstanding</p>
                </div>
              </div>

              <div className="h-2 rounded-full bg-surface-container-high overflow-hidden mb-md">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${c.progressPct}%` }} />
              </div>

              {c.hrInstructions && (
                <div className="rounded-lg bg-surface-container-low p-md mb-md">
                  <p className="text-body-md text-on-surface whitespace-pre-line">{c.hrInstructions}</p>
                </div>
              )}

              <div className="flex flex-col gap-sm">
                {c.tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-md rounded-lg border border-outline-variant/40 p-md">
                    <div className="flex items-center gap-sm min-w-0">
                      <Icon name={TYPE_ICON[t.type] || "info"} className="text-on-surface-variant flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-body-md text-on-surface font-medium truncate">{t.title}</p>
                        {t.description && <p className="text-body-sm text-on-surface-variant">{t.description}</p>}
                        {t.status === "rejected" && t.reviewerNote && (
                          <p className="text-body-sm text-danger">Needs attention: {t.reviewerNote}</p>
                        )}
                        {t.dueDate && <p className="text-body-sm text-on-surface-variant">Due {formatDate(t.dueDate)}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-xs flex-shrink-0">
                      <Badge tone={STATUS_TONE[t.status] || "neutral"}>{STATUS_LABEL[t.status] || t.status}</Badge>
                      {NEEDS_ACTION(t.status) && t.type === "acknowledgement" && (
                        <Button size="sm" leftIcon="check" isLoading={isBusy} onClick={() => acknowledge(t.id)}>
                          Acknowledge
                        </Button>
                      )}
                      {NEEDS_ACTION(t.status) && t.type === "form" && (
                        <Button size="sm" leftIcon="edit" onClick={() => setFormTask(t)}>
                          Complete
                        </Button>
                      )}
                      {NEEDS_ACTION(t.status) && t.type === "document" && (
                        <Button size="sm" leftIcon="upload" isLoading={isBusy} onClick={() => pickDocument(t.id)}>
                          Upload
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        title={formTask ? formTask.title : "Complete task"}
        isOpen={Boolean(formTask)}
        onClose={() => setFormTask(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormTask(null)}>
              Cancel
            </Button>
            <Button leftIcon="check" isLoading={isBusy} disabled={!details.trim()} onClick={submitFormTask}>
              Submit
            </Button>
          </>
        }
      >
        <Textarea
          label={formTask?.description || "Details"}
          rows={5}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Enter the requested information…"
        />
      </Modal>
    </div>
  );
}
