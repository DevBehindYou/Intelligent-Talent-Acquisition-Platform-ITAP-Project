import { create } from "zustand";

// Super-admin auth state, isolated from the staff and candidate stores.
export const useAdminAuthStore = create((set) => ({
  admin: null, // { id, email, fullName, mfaEnabled }
  status: "idle", // "idle" | "authenticated" | "unauthenticated"
  setAdmin: (admin) => set({ admin, status: admin ? "authenticated" : "unauthenticated" }),
  clear: () => set({ admin: null, status: "unauthenticated" }),
}));
