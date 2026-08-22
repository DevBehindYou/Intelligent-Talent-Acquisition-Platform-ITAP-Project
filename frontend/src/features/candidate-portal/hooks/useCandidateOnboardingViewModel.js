import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { candidateOnboardingApi, candidateResumeApi } from "../services/candidateApi.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

export function useCandidateOnboardingViewModel() {
  const queryClient = useQueryClient();
  const pushToast = useNotificationsStore((s) => s.pushToast);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["candidate", "onboarding"] });

  const { data, isLoading } = useQuery({ queryKey: ["candidate", "onboarding"], queryFn: candidateOnboardingApi.list });

  const done = () => {
    invalidate();
    pushToast({ tone: "success", message: "Task updated." });
  };
  const fail = (err) => pushToast({ tone: "danger", message: err?.response?.data?.error?.message || "Could not update task." });

  const submitForm = useMutation({
    mutationFn: ({ taskId, details }) => candidateOnboardingApi.submitTask(taskId, { submissionData: { details } }),
    onSuccess: done,
    onError: fail,
  });

  const acknowledge = useMutation({
    mutationFn: (taskId) => candidateOnboardingApi.acknowledgeTask(taskId),
    onSuccess: done,
    onError: fail,
  });

  const submitDocument = useMutation({
    mutationFn: async ({ taskId, file }) => {
      const doc = await candidateResumeApi.upload(file, "other"); // stored as a private candidate document
      return candidateOnboardingApi.submitTask(taskId, { documentId: doc._id });
    },
    onSuccess: done,
    onError: fail,
  });

  return {
    cases: data ?? [],
    isLoading,
    submitForm: submitForm.mutate,
    acknowledge: acknowledge.mutate,
    submitDocument: submitDocument.mutate,
    isBusy: submitForm.isPending || acknowledge.isPending || submitDocument.isPending,
  };
}
