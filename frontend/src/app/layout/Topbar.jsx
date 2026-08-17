import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../shared/components/Icon.jsx";
import Avatar from "../../shared/components/Avatar.jsx";
import { useOnClickOutside } from "../../shared/hooks/useOnClickOutside.js";
import { useRef } from "react";
import { useAuthViewModel } from "../../features/auth/hooks/useAuthViewModel.js";
import { useNotificationsStore } from "../../shared/store/notificationsStore.js";
import { useUiStore } from "../../shared/store/uiStore.js";

export default function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthViewModel();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const menuRef = useRef(null);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const openMobileNav = useUiStore((s) => s.openMobileNav);
  useOnClickOutside(menuRef, () => setMenuOpen(false));

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (query.trim()) navigate(`/talent-search?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="h-16 bg-paper hairline-b flex items-center justify-between px-md gap-sm md:gap-md flex-shrink-0">
      <button
        onClick={openMobileNav}
        aria-label="Open menu"
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded hover:bg-surface-container-low text-on-surface-variant flex-shrink-0"
      >
        <Icon name="menu" />
      </button>

      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative min-w-0">
        <Icon name="search" size={18} className="absolute left-sm top-1/2 -translate-y-1/2 text-outline" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search candidates, jobs..."
          className="w-full h-9 rounded bg-surface-container-low pl-[36px] pr-sm text-body-md outline-none focus:ring-1 focus:ring-prussian"
        />
      </form>

      <div className="flex items-center gap-1 md:gap-sm flex-shrink-0">
        <button
          onClick={() => navigate("/notifications")}
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          className="relative w-9 h-9 flex items-center justify-center rounded hover:bg-surface-container-low text-on-surface-variant"
        >
          <Icon name="notifications" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger" />
          )}
        </button>
        <button
          onClick={() => navigate("/settings/profile")}
          aria-label="Settings"
          className="w-9 h-9 flex items-center justify-center rounded hover:bg-surface-container-low text-on-surface-variant"
        >
          <Icon name="settings" />
        </button>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 ml-sm">
            <Avatar name={user?.fullName} src={user?.avatarUrl} size={32} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-paper border border-outline-variant/40 rounded-lg shadow-md py-1 z-20">
              <div className="px-md py-sm hairline-b">
                <p className="text-body-md text-on-surface font-medium">{user?.fullName}</p>
                <p className="text-body-sm text-on-surface-variant">{user?.email}</p>
              </div>
              <button
                onClick={() => navigate("/settings/profile")}
                className="w-full text-left px-md py-sm text-body-sm hover:bg-surface-container-low"
              >
                Profile settings
              </button>
              <button onClick={() => logout()} className="w-full text-left px-md py-sm text-body-sm text-danger hover:bg-surface-container-low">
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
