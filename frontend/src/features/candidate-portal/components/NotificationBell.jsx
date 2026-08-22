import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../../shared/components/Icon.jsx";
import { useOnClickOutside } from "../../../shared/hooks/useOnClickOutside.js";
import { formatDate } from "../../../shared/utils/format.js";
import { useCandidateNotificationsViewModel } from "../hooks/useCandidateNotificationsViewModel.js";

const LABEL = {
  interview_scheduled_candidate: "Interview scheduled",
  application_status_changed: "Application update",
  message_received: "New message",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  useOnClickOutside(ref, () => setOpen(false));
  const { notifications, unreadCount, markRead, markAllRead } = useCandidateNotificationsViewModel();

  function onItemClick(n) {
    if (!n.readAt) markRead(n._id);
    setOpen(false);
    if (n.type === "interview_scheduled_candidate") navigate("/candidate/interviews");
    else if (n.payload?.applicationId) navigate(`/candidate/applications/${n.payload.applicationId}`);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center text-on-surface-variant hover:text-on-surface transition-colors"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
      >
        <Icon name="notifications" size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] leading-4 text-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-sm w-80 max-h-96 overflow-y-auto rounded-xl border border-outline-variant/40 bg-paper shadow-md z-30">
          <div className="flex items-center justify-between px-md py-sm hairline-b sticky top-0 bg-paper">
            <span className="font-display-sm text-display-sm text-on-surface">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={() => markAllRead()} className="text-body-sm text-prussian hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="px-md py-lg text-body-sm text-on-surface-variant text-center">You&rsquo;re all caught up.</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n._id}
                onClick={() => onItemClick(n)}
                className={`w-full text-left px-md py-sm hover:bg-surface-container-low transition-colors ${
                  n.readAt ? "" : "bg-primary/5"
                }`}
              >
                <p className="text-body-sm text-on-surface font-medium">{LABEL[n.type] || "Update"}</p>
                <p className="text-body-sm text-on-surface-variant">{formatDate(n.createdAt)}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
