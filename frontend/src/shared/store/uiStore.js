import { create } from "zustand";

// Cross-feature UI state (sidebar collapse, Copilot drawer open/context, table density).
// Lives in shared/store per the MVVM boundary rule: features never import each other's
// hooks directly, so cross-feature UI (e.g. "open Copilot for this candidate" from the
// Candidates feature) goes through this shared store instead.
export const useUiStore = create((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // Below the `lg` breakpoint the sidebar becomes an off-canvas overlay instead of a
  // permanent flex column — docs/05-ui-ux-design-system.md §12 ("sm: sidebar becomes a
  // bottom sheet / hamburger"). Separate from `sidebarCollapsed`, which only applies at
  // desktop widths.
  mobileNavOpen: false,
  openMobileNav: () => set({ mobileNavOpen: true }),
  closeMobileNav: () => set({ mobileNavOpen: false }),

  tableDensity: "comfortable", // "comfortable" | "compact"
  setTableDensity: (density) => set({ tableDensity: density }),

  copilot: { isOpen: false, context: null },
  openCopilot: (context) => set({ copilot: { isOpen: true, context } }),
  closeCopilot: () => set({ copilot: { isOpen: false, context: null } }),
}));
