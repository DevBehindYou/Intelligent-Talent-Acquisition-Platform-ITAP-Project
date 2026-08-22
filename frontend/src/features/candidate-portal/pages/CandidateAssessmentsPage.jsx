import { useState } from "react";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import Button from "../../../shared/components/Button.jsx";
import Modal from "../../../shared/components/Modal.jsx";
import Textarea from "../../../shared/components/Textarea.jsx";
import EmptyState from "../../../shared/components/EmptyState.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { formatDate } from "../../../shared/utils/format.js";
import { useCandidateAssessmentsViewModel } from "../hooks/useCandidateAssessmentsViewModel.js";

const STATUS_META = {
  assigned: { tone: "active", label: "To do" },
  in_progress: { tone: "active", label: "In progress" },
  submitted: { tone: "success", label: "Submitted" },
  completed: { tone: "success", label: "Completed" },
  expired: { tone: "danger", label: "Expired" },
};
const TYPE_ICON = { coding: "code", technical: "terminal", aptitude: "psychology", questionnaire: "quiz", assignment: "assignment" };

const CAN_SUBMIT = (status) => ["assigned", "in_progress"].includes(status);

export default function CandidateAssessmentsPage() {
  const { assessments, isLoading, submit, isSubmitting } = useCandidateAssessmentsViewModel();
  const [active, setActive] = useState(null); // assignment being submitted
  const [text, setText] = useState("");

  function onSubmit() {
    submit({ assignmentId: active.id, submissionText: text.trim() });
    setActive(null);
    setText("");
  }

  return (
    <div>
      <PageHeader title="Assessments" subtitle="Tasks and tests assigned as part of your applications." />

      {isLoading ? (
        <SkeletonCard />
      ) : assessments.length === 0 ? (
        <EmptyState icon="quiz" title="No assessments" description="Assigned tests and tasks will appear here." />
      ) : (
        <div className="flex flex-col gap-md">
          {assessments.map((a) => {
            const meta = STATUS_META[a.status] || { tone: "neutral", label: a.status };
            return (
              <div key={a.id} className="rounded-xl border border-outline-variant/40 bg-paper p-md">
                <div className="flex items-start justify-between gap-md flex-wrap mb-sm">
                  <div className="flex items-center gap-sm">
                    <div className="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center flex-shrink-0">
                      <Icon name={TYPE_ICON[a.type] || "quiz"} className="text-on-surface-variant" />
                    </div>
                    <div>
                      <h3 className="font-display-sm text-display-sm text-on-surface">{a.title || "Assessment"}</h3>
                      {a.type && <p className="text-body-sm text-on-surface-variant capitalize">{a.type}</p>}
                    </div>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>

                {a.instructions && <p className="text-body-md text-on-surface whitespace-pre-line mb-sm">{a.instructions}</p>}

                <div className="flex items-center justify-between gap-md flex-wrap">
                  <p className="text-body-sm text-on-surface-variant flex items-center gap-xs">
                    {a.deadline ? (
                      <>
                        <Icon name="schedule" size={16} /> Due {formatDate(a.deadline)}
                      </>
                    ) : (
                      <span>No deadline</span>
                    )}
                  </p>
                  {CAN_SUBMIT(a.status) ? (
                    <Button size="sm" leftIcon="upload" onClick={() => setActive(a)}>
                      Submit
                    </Button>
                  ) : (
                    a.submittedAt && (
                      <span className="text-body-sm text-on-surface-variant">Submitted {formatDate(a.submittedAt)}</span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        title={active ? `Submit: ${active.title}` : "Submit"}
        isOpen={Boolean(active)}
        onClose={() => setActive(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setActive(null)}>
              Cancel
            </Button>
            <Button leftIcon="upload" isLoading={isSubmitting} disabled={!text.trim()} onClick={onSubmit}>
              Submit assessment
            </Button>
          </>
        }
      >
        <Textarea
          label="Your submission"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your answer, a repository link, or notes for the reviewer…"
        />
      </Modal>
    </div>
  );
}
