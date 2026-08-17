import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/authApi.js";
import { useAuthStore } from "../store/authStore.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

// ViewModel: owns auth state/actions, exposes a plain object to the View. Views never call
// authApi or supabase directly (docs/01-technical-architecture.md §3).
export function useAuthViewModel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, status, setUser, setStatus, clear } = useAuthStore();
  const pushToast = useNotificationsStore((s) => s.pushToast);

  // TanStack Query v5 removed onSuccess/onError from useQuery options — use the returned
  // data/error values and a useEffect-style side-effect pattern instead.
  // We read the result and sync it into the Zustand auth store manually.
  const { data: meData, error: meError, status: queryStatus } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    retry: false,
    // Only run the bootstrap check once while status is idle. Once the store has
    // a real status ("authenticated" | "unauthenticated"), this query won't re-run.
    enabled: status === "idle",
    // Don't throw — we handle the error ourselves below.
    throwOnError: false,
  });

  // Sync query result -> auth store via useEffect so state updates occur after render.
  useEffect(() => {
    if (status === "idle") {
      if (queryStatus === "success" && meData) {
        setUser(meData);
      } else if (queryStatus === "error" || meError) {
        // /me returned 401 (no active session) — transition to unauthenticated so
        // ProtectedRoute redirects to /login instead of spinning the skeleton forever.
        clear();
      }
    }
  }, [status, queryStatus, meData, meError, setUser, clear]);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setUser(data.user);
      navigate("/");
    },
    onError: (err) => {
      // authApi.login already maps Supabase errors to friendly messages (#19).
      const message = err?.message || err?.response?.data?.error?.message || "Invalid email or password.";
      pushToast({ tone: "danger", message });
    },
  });

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: (data) => {
      // #2: when email confirmation is required, session is not yet available.
      if (data?.requiresEmailConfirmation) {
        pushToast({
          tone: "info",
          message: "Account created! Check your email and click the confirmation link to continue.",
        });
        return; // don't navigate — user must confirm first
      }
      setUser(data.user);
      navigate("/");
    },
    onError: (err) => {
      const message = err?.message || err?.response?.data?.error?.message || "Sign up failed.";
      pushToast({ tone: "danger", message });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clear();
      queryClient.clear();
      navigate("/login");
    },
  });

  return {
    user,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading" || status === "idle",
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    signup: signupMutation.mutate,
    isSigningUp: signupMutation.isPending,
    logout: logoutMutation.mutate,
  };
}
