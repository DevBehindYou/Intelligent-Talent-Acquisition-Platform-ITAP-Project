import { NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import Icon from "../../../shared/components/Icon.jsx";
import NotificationBell from "../components/NotificationBell.jsx";
import { useCandidateAuthViewModel } from "../hooks/useCandidateAuthViewModel.js";
import { useCandidateRealtime } from "../hooks/useCandidateRealtime.js";

const NAV = [
  { to: "/candidate/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/candidate/jobs", label: "Jobs", icon: "work" },
  { to: "/candidate/applications", label: "Applications", icon: "assignment" },
  { to: "/candidate/interviews", label: "Interviews", icon: "event" },
  { to: "/candidate/assessments", label: "Assessments", icon: "quiz" },
  { to: "/candidate/offers", label: "Offers", icon: "workspace_premium" },
  { to: "/candidate/onboarding", label: "Onboarding", icon: "assignment_turned_in" },
  { to: "/candidate/messages", label: "Messages", icon: "chat" },
  { to: "/candidate/resumes", label: "Resumes", icon: "description" },
  { to: "/candidate/profile", label: "Profile", icon: "person" },
];

function navClass({ isActive }) {
  return clsx(
    "flex items-center gap-xs px-sm py-sm rounded text-body-sm transition-colors whitespace-nowrap",
    isActive ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-container-low"
  );
}

export default function CandidatePortalShell() {
  const { candidate, logout } = useCandidateAuthViewModel();
  useCandidateRealtime(); // live updates while the portal is open

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="bg-paper hairline-b sticky top-0 z-20">
        {/* Single nav that fills the middle and scrolls horizontally when items don't fit, so the
            header never exceeds the viewport at any width. Brand + controls never shrink. */}
        <div className="max-w-7xl mx-auto px-md h-16 flex items-center gap-md">
          <div className="flex items-center gap-sm flex-shrink-0">
            <div className="w-8 h-8 rounded bg-ink flex items-center justify-center">
              <Icon name="badge" className="text-white" size={18} />
            </div>
            <span className="font-display-sm text-display-sm text-on-surface hidden sm:block">ITAP Careers</span>
          </div>
          <nav className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass}>
                <Icon name={item.icon} size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-sm flex-shrink-0">
            <NotificationBell />
            <span className="hidden lg:block text-body-sm text-on-surface-variant max-w-[120px] truncate">
              {candidate?.fullName}
            </span>
            <button
              onClick={() => logout()}
              className="flex items-center gap-xs text-on-surface-variant hover:text-danger transition-colors"
              aria-label="Log out"
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto p-margin-mobile lg:p-margin-desktop">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
