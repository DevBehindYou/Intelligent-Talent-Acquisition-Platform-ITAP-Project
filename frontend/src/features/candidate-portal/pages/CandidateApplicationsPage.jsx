import { Link } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import Button from "../../../shared/components/Button.jsx";
import EmptyState from "../../../shared/components/EmptyState.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import { formatDate } from "../../../shared/utils/format.js";
import { useCandidateApplicationsViewModel } from "../hooks/useCandidateApplicationsViewModel.js";
import { statusTone } from "../lib/applicationStatus.js";

export default function CandidateApplicationsPage() {
  const { applications, isLoading } = useCandidateApplicationsViewModel();

  return (
    <div>
      <PageHeader
        title="My applications"
        subtitle="Every role you've applied to, and where it stands."
        actions={
          <Button as={Link} to="/candidate/jobs" variant="secondary" size="sm" leftIcon="search">
            Browse jobs
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonCard />
      ) : applications.length === 0 ? (
        <EmptyState
          icon="assignment"
          title="No applications yet"
          description="When you apply to a role, you'll be able to track its progress here."
        />
      ) : (
        <div className="flex flex-col gap-sm">
          {applications.map((app) => (
            <Link
              key={app.id}
              to={`/candidate/applications/${app.id}`}
              className="flex items-center justify-between gap-md rounded-xl border border-outline-variant/40 bg-paper p-md hover:border-primary/40 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-body-md text-on-surface font-medium truncate">{app.job?.title || "Role"}</p>
                <p className="text-body-sm text-on-surface-variant">
                  {[app.job?.location, app.submittedAt ? `Applied ${formatDate(app.submittedAt)}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-sm flex-shrink-0">
                <Badge tone={statusTone(app.status)}>{app.statusLabel}</Badge>
                <Icon name="chevron_right" className="text-outline" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
