import Icon from "./Icon.jsx";
import { formatDate } from "../utils/format.js";

const EVENT_ICON = { stage_change: "swap_horiz", interview: "event", note: "sticky_note_2", default: "circle" };

export default function Timeline({ events = [] }) {
  if (events.length === 0) {
    return <p className="text-body-sm text-on-surface-variant">No activity yet.</p>;
  }
  return (
    <ol className="relative border-l border-outline-variant/40 pl-md space-y-md">
      {events.map((event, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[23px] top-0 w-3 h-3 rounded-full bg-prussian border-2 border-paper" />
          <div className="flex items-center gap-1 text-body-sm text-on-surface-variant">
            <Icon name={EVENT_ICON[event.type] || EVENT_ICON.default} size={14} />
            {formatDate(event.date)}
          </div>
          <p className="text-body-md text-on-surface">{event.description}</p>
        </li>
      ))}
    </ol>
  );
}
