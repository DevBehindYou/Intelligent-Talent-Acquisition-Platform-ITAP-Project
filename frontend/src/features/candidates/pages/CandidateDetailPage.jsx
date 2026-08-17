import { useNavigate } from "react-router-dom";
import Breadcrumbs from "../../../shared/components/Breadcrumbs.jsx";
import Button from "../../../shared/components/Button.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import MatchDial from "../../../shared/components/MatchDial.jsx";
import ScoreBreakdown from "../../../shared/components/ScoreBreakdown.jsx";
import Timeline from "../../../shared/components/Timeline.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { useCandidateDetailViewModel } from "../hooks/useCandidateDetailViewModel.js";

export default function CandidateDetailPage() {
  const navigate = useNavigate();
  const vm = useCandidateDetailViewModel();

  if (vm.isLoading || !vm.candidate) {
    return <SkeletonCard />;
  }

  const { candidate, explanation, questions } = vm;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Candidates", to: "/candidates" }, { label: candidate.fullName }]} />

      {/* Hero */}
      <div className="flex items-start justify-between gap-md mt-sm mb-lg flex-wrap">
        <div className="flex items-center gap-md">
          <MatchDial score={explanation?.overallScore ?? candidate.bestMatchScore ?? 0} size="lg" />
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface">{candidate.fullName}</h1>
            <p className="text-body-md text-on-surface-variant">{candidate.currentTitle}</p>
            <p className="text-body-sm text-on-surface-variant mt-1">
              {candidate.email} · {candidate.totalExperienceYears} yrs experience
            </p>
          </div>
        </div>
        <div className="flex items-center gap-sm flex-wrap">
          <Button variant="secondary" leftIcon="auto_awesome" onClick={vm.openCopilotForCandidate}>
            Ask Copilot
          </Button>
          <Button variant="secondary" leftIcon="mail" onClick={() => navigate(`/candidates/${candidate._id}/message${vm.jobId ? `?jobId=${vm.jobId}` : ''}`)}>
            Message
          </Button>
          {vm.jobId && (
            <Button variant="secondary" leftIcon="event" onClick={() => navigate(`/candidates/${candidate._id}/schedule?jobId=${vm.jobId}`)}>
              Schedule
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <div className="lg:col-span-2 flex flex-col gap-lg">
          {explanation && (
            <section className="rounded-xl border border-outline-variant/40 bg-paper p-md">
              <h2 className="font-display-sm text-display-sm text-on-surface mb-sm">Why this ranking</h2>
              <div className="ai-highlight p-sm rounded mb-md">
                <p className="text-body-md text-on-surface leading-relaxed">{explanation.explanation}</p>
              </div>
              <ScoreBreakdown scores={explanation} />
            </section>
          )}

          <section className="rounded-xl border border-outline-variant/40 bg-paper p-md">
            <h2 className="font-display-sm text-display-sm text-on-surface mb-sm">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {(candidate.skills ?? []).map((skill) => (
                <Badge key={skill.name} tone="neutral">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant/40 bg-paper p-md">
            <h2 className="font-display-sm text-display-sm text-on-surface mb-sm">Education & certifications</h2>
            <div className="space-y-sm">
              {(candidate.education ?? []).map((ed, i) => (
                <div key={i} className="flex items-center gap-sm text-body-md text-on-surface">
                  <Icon name="school" size={18} className="text-outline" />
                  {ed.degree}, {ed.institution} ({ed.year})
                </div>
              ))}
              {(candidate.certifications ?? []).map((cert) => (
                <div key={cert} className="flex items-center gap-sm text-body-md text-on-surface">
                  <Icon name="verified" size={18} className="text-outline" />
                  {cert}
                </div>
              ))}
            </div>
          </section>

          {questions.length > 0 && (
            <section className="rounded-xl border border-outline-variant/40 bg-paper p-md">
              <h2 className="font-display-sm text-display-sm text-on-surface mb-sm">Suggested interview questions</h2>
              <ol className="space-y-sm list-decimal list-inside">
                {questions.map((q) => (
                  <li key={q._id} className="text-body-md text-on-surface">
                    {q.question}
                    <span className="ml-2 text-body-sm text-on-surface-variant capitalize">({q.category?.replace("_", " ")})</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-lg">
          {vm.jobId && (
            <section className="rounded-xl border border-outline-variant/40 bg-paper p-md">
              <h2 className="font-display-sm text-display-sm text-on-surface mb-sm">Move stage</h2>
              <div className="flex flex-col gap-2">
                <Button variant="primary" leftIcon="arrow_forward" isLoading={vm.isMovingStage} onClick={() => vm.moveStage("interviewing")}>
                  Move to Interviewing
                </Button>
                <Button variant="danger" leftIcon="close" isLoading={vm.isMovingStage} onClick={() => vm.moveStage("rejected")}>
                  Reject
                </Button>
              </div>
            </section>
          )}

          <section className="rounded-xl border border-outline-variant/40 bg-paper p-md">
            <h2 className="font-display-sm text-display-sm text-on-surface mb-sm">History</h2>
            <Timeline events={candidate.timeline ?? []} />
          </section>
        </div>
      </div>
    </div>
  );
}
