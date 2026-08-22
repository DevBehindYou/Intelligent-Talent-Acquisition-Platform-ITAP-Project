import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { candidateProfileApi } from "../services/candidateApi.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

export function useCandidateProfileViewModel() {
  const queryClient = useQueryClient();
  const pushToast = useNotificationsStore((s) => s.pushToast);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["candidate", "profile"],
    queryFn: candidateProfileApi.get,
  });

  const updateMutation = useMutation({
    mutationFn: candidateProfileApi.update,
    onSuccess: (updated) => {
      queryClient.setQueryData(["candidate", "profile"], updated);
      pushToast({ tone: "success", message: "Profile saved." });
    },
    onError: (err) => {
      pushToast({ tone: "danger", message: err?.response?.data?.error?.message || "Could not save profile." });
    },
  });

  return {
    profile: data,
    completionPct: data?.profileCompletionPct ?? 0,
    isLoading,
    isError,
    update: updateMutation.mutate,
    isSaving: updateMutation.isPending,
  };
}
