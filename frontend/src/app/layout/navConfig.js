// Central nav config so Sidebar stays a dumb View component (docs/08 §3, "Sidebar" — role-aware
// composition happens here, not by the Sidebar branching on role internally).
export const NAV_ITEMS = [
  { to: "/", icon: "dashboard", label: "Dashboard", roles: ["recruiter", "hiring_manager", "hr_admin"] },
  { to: "/jobs", icon: "work", label: "Jobs", roles: ["recruiter", "hr_admin"] },
  { to: "/candidates", icon: "groups", label: "Candidates", roles: ["recruiter", "hr_admin"] },
  { to: "/pipeline", icon: "account_tree", label: "Pipeline", roles: ["recruiter", "hr_admin"] },
  { to: "/talent-search", icon: "travel_explore", label: "Talent Search", roles: ["recruiter", "hr_admin"] },
  { to: "/talent-pools", icon: "bookmark", label: "Talent Pools", roles: ["recruiter", "hr_admin"] },
  { to: "/shortlists", icon: "star", label: "My Shortlists", roles: ["hiring_manager"] },
  { to: "/analytics", icon: "analytics", label: "Analytics", roles: ["recruiter", "hiring_manager", "hr_admin"] },
  { to: "/admin/users", icon: "admin_panel_settings", label: "Admin", roles: ["hr_admin"] },
];
