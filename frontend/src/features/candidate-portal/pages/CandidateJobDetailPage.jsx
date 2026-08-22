import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Button from "../../../shared/components/Button.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import Modal from "../../../shared/components/Modal.jsx";
import Select from "../../../shared/components/Select.jsx";
import Textarea from "../../../shared/components/Textarea.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { useCandidateJobDetailViewModel } from "../hooks/useCandidateJobsViewModel.js";
import { useCandidateApplicationsViewModel } from "../hooks/useCandidateApplicationsViewModel.js";
import { useCandidateResumesViewModel } from "../hooks/useCandidateResumesViewModel.js";
import { statusTone } from "../lib/applicationStatus.js";

export default function CandidateJobDetailPage() {
  const { jobId } = useParams();
  const { job, isLoading } = useCandidateJobDetailViewModel(jobId);
  const { applications, apply, isApplying } = useCandidateApplicationsViewModel();
  const { resumes } = useCandidateResumesViewModel();

  const [modalOpen, setModalOpen] = useState(false);
  const [resumeId, setResumeId] = useState("");
  const [note, setNote] = useState("");

  const existing = applications.find((a) => String(a.job?.id) === String(jobId));

  if (isLoading) return <SkeletonCard />;
  if (!job) {
    return (
      <div className="text-center py-2xl">
        <p className="text-body-md text-on-surface-variant">This role is no longer available.</p>
        <Button as={Link} to="/candidate/jobs" variant="secondary" size="sm" className="mt-md">
          Back to jobs
        </Button>
      </div>
    );
  }

  const resumeOptions = [
    { value: "", label: resumes.length ? "Use my primary resume" : "No resume uploaded" },
    ...resumes.map((r) => ({ value: r._id, label: `${r.fileName}${r.isPrimary ? " (primary)" : ""}` })),
  ];

  function submitApplication() {
    const answers = note.trim() ? [{ question: "Anything you'd like to add?", answer: note.trim() }] : [];
    apply({ jobId, resumeDocumentId: resumeId || undefined, answers });
    setModalOpen(false);
  }

  return (
    <div>
      <PageHeader
        title={job.title}
        subtitle={[job.company?.name, job.department].filter(Boolean).join(" · ")}
        breadcrumbs={
          <Link to="/candidate/jobs" className="text-body-sm text-prussian hover:underline inline-flex items-center gap-xs">
            <Icon name="arrow_back" size={16} /> All jobs
          </Link>
        }
        actions={
          existing ? (
            <Badge tone={statusTone(existing.status)}>{existing.statusLabel}</Badge>
          ) : (
            <Button leftIcon="send" onClick={() => setModalOpen(true)}>
              Apply now
            </Button>
          )
        }
      />

      <div className="flex flex-wrap gap-xs mb-lg">
        {job.location && <Badge icon={<Icon name="place" size={14} />}>{job.location}</Badge>}
        {job.workMode && <Badge tone="active">{job.workMode}</Badge>}
        {job.employmentType && <Badge>{job.employmentType.replace("_", " ")}</Badge>}
        {job.experienceLevel && <Badge>{job.experienceLevel}</Badge>}
        {job.salaryRange?.min && (
          <Badge tone="success">
            {job.salaryRange.currency || "$"}
            {job.salaryRange.min.toLocaleString()}
            {job.salaryRange.max ? `–${job.salaryRange.max.toLocaleString()}` : "+"}
          </Badge>
        )}
      </div>

      <div className="rounded-xl border border-outline-variant/40 bg-paper p-lg">
        <h2 className="font-display-sm text-display-sm text-on-surface mb-sm">About this role</h2>
        <p className="text-body-md text-on-surface whitespace-pre-line">{job.description || "No description provided."}</p>

        {job.requiredSkills?.length > 0 && (
          <>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-lg mb-sm">Required skills</h3>
            <div className="flex flex-wrap gap-xs">
              {job.requiredSkills.map((s, i) => (
                <Badge key={i} tone={s.mustHave ? "active" : "neutral"}>
                  {s.name}
                </Badge>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        title={`Apply to ${job.title}`}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button leftIcon="send" isLoading={isApplying} onClick={submitApplication}>
              Submit application
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-md">
          <Select label="Resume" value={resumeId} onChange={(e) => setResumeId(e.target.value)} options={resumeOptions} />
          {resumes.length === 0 && (
            <p className="text-body-sm text-warning">
              You have no resume uploaded.{" "}
              <Link to="/candidate/resumes" className="underline">
                Add one first
              </Link>
              .
            </p>
          )}
          <Textarea
            label="Anything to add? (optional)"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A short note to the hiring team…"
          />
        </div>
      </Modal>
    </div>
  );
}
