import { create } from "zustand";

// Candidate-side auth state, kept entirely separate from the staff useAuthStore so the two
// portals never share identity in the SPA.
export const useCandidateAuthStore = create((set) => ({
  candidate: null, // { id, fullName, email, avatarUrl, headline, emailVerifiedAt }
  status: "idle", // "idle" | "authenticated" | "unauthenticated"
  setCandidate: (candidate) => set({ candidate, status: candidate ? "authenticated" : "unauthenticated" }),
  clear: () => set({ candidate: null, status: "unauthenticated" }),
}));
