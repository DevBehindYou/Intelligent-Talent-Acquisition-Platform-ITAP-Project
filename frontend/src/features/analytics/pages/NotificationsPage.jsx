import PageHeader from "../../../shared/components/PageHeader.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import EmptyState from "../../../shared/components/EmptyState.jsx";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";
import { formatDate } from "../../../shared/utils/format.js";

export default function NotificationsPage() {
  const notifications = useNotificationsStore((s) => s.notifications);

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Ranking updates, stage changes, and interview reminders." />
      {notifications.length === 0 ? (
        <EmptyState icon="notifications" title="You're all caught up" description="New notifications will appear here in real time." />
      ) : (
        <div className="rounded-xl border border-outline-variant/40 bg-paper divide-y divide-outline-variant/20">
          {notifications.map((n, i) => (
            <div key={i} className="flex items-start gap-sm p-md">
              <Icon name="notifications" size={18} className="text-outline mt-1" />
              <div>
                <p className="text-body-md text-on-surface">{n.payload?.message || n.type}</p>
                <p className="text-body-sm text-on-surface-variant">{formatDate(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
