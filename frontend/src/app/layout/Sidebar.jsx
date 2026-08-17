import { NavLink } from "react-router-dom";
import clsx from "clsx";
import Icon from "../../shared/components/Icon.jsx";
import Tooltip from "../../shared/components/Tooltip.jsx";
import { NAV_ITEMS } from "./navConfig.js";
import { useUiStore } from "../../shared/store/uiStore.js";
import { useAuthViewModel } from "../../features/auth/hooks/useAuthViewModel.js";

/**
 * Desktop (>= lg): fixed icon-rail, collapsible to a labeled sidebar — unchanged from the
 * original implementation.
 * Mobile (< lg): off-canvas overlay that slides in from the left with a dismissible
 * backdrop, per docs/05-ui-ux-design-system.md §12. This was missing in the first pass —
 * the sidebar was previously a permanent flex child at every viewport width.
 */
export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileNavOpen, closeMobileNav } = useUiStore();
  const { user, logout } = useAuthViewModel();
  const items = NAV_ITEMS.filter((item) => !user || item.roles.includes(user.role));

  return (
    <>
      {/* Mobile backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-ink/50 z-30 lg:hidden"
          onClick={closeMobileNav}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          "bg-ink text-white flex flex-col justify-between flex-shrink-0 transition-transform duration-200",
          // Mobile: fixed off-canvas overlay, slides in/out
          "fixed inset-y-0 left-0 z-40 w-[240px]",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: back to a normal in-flow flex column, ignores the mobile transform/position
          "lg:static lg:translate-x-0 lg:transition-[width]",
          sidebarCollapsed ? "lg:w-[72px]" : "lg:w-[240px]"
        )}
      >
        <div>
          <div className="h-16 flex items-center px-md gap-sm hairline-b border-white/10 justify-between">
            <div className="flex items-center gap-sm">
              <div className="w-8 h-8 rounded bg-secondary-fixed-dim flex items-center justify-center flex-shrink-0">
                <Icon name="radar" className="text-ink" size={18} />
              </div>
              {(!sidebarCollapsed || mobileNavOpen) && <span className="font-display-sm text-display-sm">ITAP</span>}
            </div>
            <button onClick={closeMobileNav} aria-label="Close menu" className="lg:hidden text-white/60">
              <Icon name="close" size={20} />
            </button>
          </div>

          <nav className="flex flex-col gap-1 p-sm">
            {items.map((item) => (
              <NavItem key={item.to} item={item} collapsed={sidebarCollapsed} onNavigate={closeMobileNav} />
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-1 p-sm border-t border-white/10">
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center gap-sm px-sm py-sm rounded text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Icon name={sidebarCollapsed ? "chevron_right" : "chevron_left"} />
            {!sidebarCollapsed && <span className="text-body-sm">Collapse</span>}
          </button>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-sm px-sm py-sm rounded text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Icon name="help" />
            {(!sidebarCollapsed || mobileNavOpen) && <span className="text-body-sm">Help</span>}
          </a>
          <button
            onClick={() => logout()}
            className="flex items-center gap-sm px-sm py-sm rounded text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Icon name="logout" />
            {(!sidebarCollapsed || mobileNavOpen) && <span className="text-body-sm">Log out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

function NavItem({ item, collapsed, onNavigate }) {
  const link = (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-sm px-sm py-sm rounded transition-colors border-l-2",
          isActive
            ? "bg-white/10 text-white border-secondary-fixed-dim"
            : "text-white/60 border-transparent hover:bg-white/5 hover:text-white"
        )
      }
    >
      <Icon name={item.icon} />
      {/* Label hides only when collapsed AND at desktop width — the mobile off-canvas
          drawer always shows full labels, it's never in icon-rail mode. */}
      <span className={clsx("text-body-sm", collapsed && "lg:hidden")}>{item.label}</span>
    </NavLink>
  );

  if (!collapsed) return link;

  return (
    <>
      <span className="hidden lg:block">
        <Tooltip label={item.label}>{link}</Tooltip>
      </span>
      <span className="lg:hidden">{link}</span>
    </>
  );
}
