import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null, // { id, fullName, email, role, organizationId }
  status: "idle", // "idle" | "loading" | "authenticated" | "unauthenticated"
  setUser: (user) => set({ user, status: user ? "authenticated" : "unauthenticated" }),
  setStatus: (status) => set({ status }),
  clear: () => set({ user: null, status: "unauthenticated" }),
}));
