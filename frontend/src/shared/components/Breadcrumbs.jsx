import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-body-sm text-on-surface-variant">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1">
          {i > 0 && <Icon name="chevron_right" size={14} />}
          {item.to ? (
            <Link to={item.to} className="hover:text-prussian">
              {item.label}
            </Link>
          ) : (
            <span className="text-on-surface">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
