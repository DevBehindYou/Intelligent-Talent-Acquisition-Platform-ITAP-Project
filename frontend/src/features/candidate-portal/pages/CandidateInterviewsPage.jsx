import PageHeader from "../../../shared/components/PageHeader.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import Button from "../../../shared/components/Button.jsx";
import EmptyState from "../../../shared/components/EmptyState.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { formatDate } from "../../../shared/utils/format.js";
import { useCandidateInterviewsViewModel } from "../hooks/useCandidateInterviewsViewModel.js";

const TYPE_META = {
  phone: { icon: "call", label: "Phone" },
  video: { icon: "videocam", label: "Video" },
  onsite: { icon: "location_on", label: "On-site" },
};
const STATUS_TONE = { scheduled: "active", completed: "success", cancelled: "danger", no_show: "danger" };

function formatDateTime(value) {
  if (!value) return "—";
  return formatDate(value, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function CandidateInterviewsPage() {
  const { interviews, isLoading } = useCandidateInterviewsViewModel();

  return (
    <div>
      <PageHeader title="Interviews" subtitle="Your scheduled and past interviews." />

      {isLoading ? (
        <SkeletonCard />
      ) : interviews.length === 0 ? (
        <EmptyState
          icon="event"
          title="No interviews yet"
          description="When a recruiter schedules an interview, it'll show up here in real time."
        />
      ) : (
        <div className="flex flex-col gap-md">
          {interviews.map((iv) => {
            const type = TYPE_META[iv.type] || TYPE_META.video;
            return (
              <div key={iv.id} className="rounded-xl border border-outline-variant/40 bg-paper p-md">
                <div className="flex items-start justify-between gap-md flex-wrap">
                  <div>
                    <h3 className="font-display-sm text-display-sm text-on-surface">{iv.job?.title || "Interview"}</h3>
                    <p className="text-body-sm text-on-surface-variant flex items-center gap-xs mt-1">
                      <Icon name="schedule" size={16} /> {formatDateTime(iv.scheduledAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-xs">
                    <Badge icon={<Icon name={type.icon} size={14} />}>{type.label}</Badge>
                    <Badge tone={STATUS_TONE[iv.status] || "neutral"}>{iv.status.replace("_", " ")}</Badge>
                  </div>
                </div>

                {(iv.meetingLink || iv.location || iv.instructions) && (
                  <div className="mt-md flex flex-col gap-sm">
                    {iv.meetingLink && (
                      <Button
                        as="a"
                        href={iv.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        variant="secondary"
                        size="sm"
                        leftIcon="videocam"
                        className="w-fit"
                      >
                        Join meeting
                      </Button>
                    )}
                    {iv.location && (
                      <p className="text-body-sm text-on-surface flex items-center gap-xs">
                        <Icon name="place" size={16} className="text-outline" /> {iv.location}
                      </p>
                    )}
                    {iv.instructions && (
                      <p className="text-body-sm text-on-surface-variant">{iv.instructions}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
