import { Link } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import Button from "../../../shared/components/Button.jsx";
import EmptyState from "../../../shared/components/EmptyState.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import { useCandidateProfileViewModel } from "../hooks/useCandidateProfileViewModel.js";
import { useCandidateApplicationsViewModel } from "../hooks/useCandidateApplicationsViewModel.js";
import { useCandidateJobsViewModel } from "../hooks/useCandidateJobsViewModel.js";
import { useCandidateOffersViewModel } from "../hooks/useCandidateOffersViewModel.js";
import { statusTone } from "../lib/applicationStatus.js";

function Card({ children, className = "" }) {
  return <div className={`rounded-xl border border-outline-variant/40 bg-paper p-md ${className}`}>{children}</div>;
}

export default function CandidateDashboardPage() {
  const { profile, completionPct } = useCandidateProfileViewModel();
  const { applications, isLoading: appsLoading } = useCandidateApplicationsViewModel();
  const { jobs } = useCandidateJobsViewModel({ pageSize: 4 });
  const { offers } = useCandidateOffersViewModel();

  const recentApps = applications.slice(0, 4);
  const activeCount = applications.filter((a) => !["withdrawn", "rejected"].includes(a.status)).length;
  const pendingOffers = offers.filter((o) => o.status === "released").length;

  return (
    <div>
      <PageHeader
        title={`Welcome${profile?.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""}`}
        subtitle="Here's where your applications stand today."
      />

      {pendingOffers > 0 && (
        <Link
          to="/candidate/offers"
          className="flex items-center justify-between gap-md rounded-xl border border-success/40 bg-success/10 p-md mb-lg hover:bg-success/15 transition-colors"
        >
          <div className="flex items-center gap-sm">
            <Icon name="workspace_premium" className="text-success" />
            <div>
              <p className="text-body-md text-on-surface font-medium">
                You have {pendingOffers} offer{pendingOffers === 1 ? "" : "s"} awaiting your response
              </p>
              <p className="text-body-sm text-on-surface-variant">Review the details and accept or decline.</p>
            </div>
          </div>
          <Icon name="chevron_right" className="text-success" />
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md mb-lg">
        {/* Profile completion */}
        <Card>
          <div className="flex items-center justify-between mb-sm">
            <h2 className="font-display-sm text-display-sm text-on-surface">Profile</h2>
            <span className="text-display-sm font-display-sm text-primary">{completionPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-container-high overflow-hidden mb-sm">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completionPct}%` }} />
          </div>
          <p className="text-body-sm text-on-surface-variant mb-md">
            A complete profile gets you noticed faster.
          </p>
          <Button as={Link} to="/candidate/profile" variant="secondary" size="sm" leftIcon="edit">
            Complete profile
          </Button>
        </Card>

        {/* Active applications */}
        <Card>
          <h2 className="font-display-sm text-display-sm text-on-surface mb-sm">Active applications</h2>
          <p className="text-display-lg font-display-lg text-on-surface">{activeCount}</p>
          <p className="text-body-sm text-on-surface-variant mb-md">In progress right now.</p>
          <Button as={Link} to="/candidate/applications" variant="secondary" size="sm" leftIcon="assignment">
            Track applications
          </Button>
        </Card>

        {/* Find jobs */}
        <Card>
          <h2 className="font-display-sm text-display-sm text-on-surface mb-sm">Find your next role</h2>
          <p className="text-body-sm text-on-surface-variant mb-md">
            Browse open positions and apply with your saved resume.
          </p>
          <Button as={Link} to="/candidate/jobs" size="sm" leftIcon="search">
            Browse jobs
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Recent applications */}
        <div>
          <h2 className="font-display-sm text-display-sm text-on-surface mb-sm">Recent applications</h2>
          {appsLoading ? (
            <SkeletonCard />
          ) : recentApps.length === 0 ? (
            <EmptyState icon="assignment" title="No applications yet" description="Apply to a job to start tracking it here." />
          ) : (
            <div className="flex flex-col gap-sm">
              {recentApps.map((app) => (
                <Link
                  key={app.id}
                  to={`/candidate/applications/${app.id}`}
                  className="flex items-center justify-between rounded-lg border border-outline-variant/40 bg-paper p-md hover:border-primary/40 transition-colors"
                >
                  <div>
                    <p className="text-body-md text-on-surface font-medium">{app.job?.title || "Role"}</p>
                    <p className="text-body-sm text-on-surface-variant">{app.job?.location || "—"}</p>
                  </div>
                  <Badge tone={statusTone(app.status)}>{app.statusLabel}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recommended jobs */}
        <div>
          <h2 className="font-display-sm text-display-sm text-on-surface mb-sm">Open roles</h2>
          {jobs.length === 0 ? (
            <EmptyState icon="work" title="No open roles right now" description="Check back soon." />
          ) : (
            <div className="flex flex-col gap-sm">
              {jobs.map((job) => (
                <Link
                  key={job._id}
                  to={`/candidate/jobs/${job._id}`}
                  className="flex items-center justify-between rounded-lg border border-outline-variant/40 bg-paper p-md hover:border-primary/40 transition-colors"
                >
                  <div>
                    <p className="text-body-md text-on-surface font-medium">{job.title}</p>
                    <p className="text-body-sm text-on-surface-variant">
                      {[job.company?.name, job.location].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <Icon name="chevron_right" className="text-outline" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
