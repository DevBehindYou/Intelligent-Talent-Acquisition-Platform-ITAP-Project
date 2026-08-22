import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { candidateAuthApi } from "../services/candidateApi.js";
import { useCandidateAuthStore } from "../store/candidateAuthStore.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

// Candidate-side counterpart to useAuthViewModel. Same bootstrap-once pattern.
export function useCandidateAuthViewModel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { candidate, status, setCandidate, clear } = useCandidateAuthStore();
  const pushToast = useNotificationsStore((s) => s.pushToast);

  const { data: meData, error: meError, status: queryStatus } = useQuery({
    queryKey: ["candidate", "me"],
    queryFn: candidateAuthApi.me,
    retry: false,
    enabled: status === "idle",
    throwOnError: false,
  });

  useEffect(() => {
    if (status !== "idle") return;
    if (queryStatus === "success" && meData) setCandidate(meData);
    else if (queryStatus === "error" || meError) clear();
  }, [status, queryStatus, meData, meError, setCandidate, clear]);

  const loginMutation = useMutation({
    mutationFn: candidateAuthApi.login,
    onSuccess: (candidateData) => {
      setCandidate(candidateData);
      navigate("/candidate/dashboard");
    },
    onError: (err) => {
      const message = err?.message || err?.response?.data?.error?.message || "Invalid email or password.";
      pushToast({ tone: "danger", message });
    },
  });

  const signupMutation = useMutation({
    mutationFn: candidateAuthApi.signup,
    onSuccess: (data) => {
      if (data?.requiresEmailConfirmation) {
        pushToast({ tone: "info", message: "Account created! Check your email to confirm, then sign in." });
        navigate("/candidate/login");
        return;
      }
      setCandidate(data.candidate);
      navigate("/candidate/dashboard");
    },
    onError: (err) => {
      const message = err?.message || err?.response?.data?.error?.message || "Sign up failed.";
      pushToast({ tone: "danger", message });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: candidateAuthApi.logout,
    onSuccess: () => {
      clear();
      queryClient.clear();
      navigate("/candidate/login");
    },
  });

  return {
    candidate,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "idle",
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    signup: signupMutation.mutate,
    isSigningUp: signupMutation.isPending,
    logout: logoutMutation.mutate,
  };
}
