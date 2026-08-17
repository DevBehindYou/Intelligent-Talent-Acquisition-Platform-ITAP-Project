export default function PageHeader({ title, subtitle, actions, breadcrumbs }) {
  return (
    <div className="flex flex-col gap-xs mb-lg">
      {breadcrumbs}
      <div className="flex items-start justify-between gap-md flex-wrap">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface">{title}</h1>
          {subtitle && <p className="text-body-md text-on-surface-variant mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-sm flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
