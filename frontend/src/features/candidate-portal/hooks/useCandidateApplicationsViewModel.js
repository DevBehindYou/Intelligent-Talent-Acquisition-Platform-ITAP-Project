import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { candidateApplicationsApi } from "../services/candidateApi.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

export function useCandidateApplicationsViewModel() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const pushToast = useNotificationsStore((s) => s.pushToast);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["candidate", "applications"],
    queryFn: candidateApplicationsApi.list,
  });

  const applyMutation = useMutation({
    mutationFn: candidateApplicationsApi.apply,
    onSuccess: (application) => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "applications"] });
      pushToast({ tone: "success", message: "Application submitted." });
      navigate(`/candidate/applications/${application.id}`);
    },
    onError: (err) => {
      const code = err?.response?.data?.error?.code;
      const message =
        code === "ALREADY_APPLIED"
          ? "You've already applied to this job."
          : err?.response?.data?.error?.message || "Could not submit application.";
      pushToast({ tone: "danger", message });
    },
  });

  return {
    applications: data ?? [],
    isLoading,
    isError,
    apply: applyMutation.mutate,
    isApplying: applyMutation.isPending,
  };
}

export function useCandidateApplicationDetailViewModel(applicationId) {
  const queryClient = useQueryClient();
  const pushToast = useNotificationsStore((s) => s.pushToast);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["candidate", "application", applicationId],
    queryFn: () => candidateApplicationsApi.get(applicationId),
    enabled: Boolean(applicationId),
  });

  const withdrawMutation = useMutation({
    mutationFn: () => candidateApplicationsApi.withdraw(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "application", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "applications"] });
      pushToast({ tone: "info", message: "Application withdrawn." });
    },
    onError: (err) => {
      pushToast({ tone: "danger", message: err?.response?.data?.error?.message || "Could not withdraw." });
    },
  });

  return {
    application: data,
    timeline: data?.timeline ?? [],
    isLoading,
    isError,
    withdraw: withdrawMutation.mutate,
    isWithdrawing: withdrawMutation.isPending,
  };
}
