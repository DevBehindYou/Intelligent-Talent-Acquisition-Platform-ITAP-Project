import Icon from "./Icon.jsx";
import Button from "./Button.jsx";

// Copy voice per docs/05-ui-ux-design-system.md §9: always name a next action, never a dead end.
export default function EmptyState({ icon = "inbox", title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-xl px-lg gap-sm">
      <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-outline">
        <Icon name={icon} size={26} />
      </div>
      <h3 className="font-display-sm text-display-sm text-on-surface">{title}</h3>
      {description && <p className="text-body-md text-on-surface-variant max-w-sm">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
