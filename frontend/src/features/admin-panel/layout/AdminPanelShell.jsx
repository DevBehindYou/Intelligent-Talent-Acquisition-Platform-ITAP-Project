import { NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import Icon from "../../../shared/components/Icon.jsx";
import { useAdminAuthViewModel } from "../hooks/useAdminAuthViewModel.js";

const NAV = [
  { to: "/admin-panel", label: "Overview", icon: "dashboard", end: true },
  { to: "/admin-panel/candidates", label: "Candidates", icon: "group" },
  { to: "/admin-panel/recruiters", label: "Recruiters", icon: "badge" },
  { to: "/admin-panel/organizations", label: "Orgs", icon: "business" },
  { to: "/admin-panel/applications", label: "Applications", icon: "assignment" },
  { to: "/admin-panel/audit", label: "Audit", icon: "receipt_long" },
  { to: "/admin-panel/security", label: "Security", icon: "encrypted" },
];

export default function AdminPanelShell() {
  const { admin, logout } = useAdminAuthViewModel();
  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-ink text-white">
        {/* Single nav fills the middle and scrolls horizontally when tight, so the header never
            exceeds the viewport — and the panel stays navigable on mobile (previously the nav was
            hidden below md with no fallback). */}
        <div className="max-w-7xl mx-auto px-md h-16 flex items-center gap-md">
          <div className="flex items-center gap-sm flex-shrink-0">
            <Icon name="shield_person" className="text-secondary-fixed-dim" />
            <span className="font-display-sm text-display-sm hidden sm:block">ITAP Platform Admin</span>
          </div>
          <nav className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-xs px-sm py-sm rounded text-body-sm transition-colors whitespace-nowrap",
                    isActive ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                  )
                }
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-md flex-shrink-0">
            <span className="hidden lg:block text-body-sm text-white/60 max-w-[160px] truncate">{admin?.email}</span>
            <button
              onClick={() => logout()}
              className="text-white/70 hover:text-white flex items-center gap-xs transition-colors"
              aria-label="Log out"
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-margin-mobile lg:p-margin-desktop">
        <Outlet />
      </main>
    </div>
  );
}
