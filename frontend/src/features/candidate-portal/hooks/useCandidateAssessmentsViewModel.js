import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { candidateAssessmentsApi } from "../services/candidateApi.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

export function useCandidateAssessmentsViewModel() {
  const queryClient = useQueryClient();
  const pushToast = useNotificationsStore((s) => s.pushToast);

  const { data, isLoading } = useQuery({
    queryKey: ["candidate", "assessments"],
    queryFn: candidateAssessmentsApi.list,
  });

  const submitMutation = useMutation({
    mutationFn: ({ assignmentId, submissionText }) => candidateAssessmentsApi.submit(assignmentId, submissionText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "assessments"] });
      pushToast({ tone: "success", message: "Assessment submitted." });
    },
    onError: (err) => pushToast({ tone: "danger", message: err?.response?.data?.error?.message || "Could not submit." }),
  });

  return {
    assessments: data ?? [],
    isLoading,
    submit: submitMutation.mutate,
    isSubmitting: submitMutation.isPending,
  };
}
