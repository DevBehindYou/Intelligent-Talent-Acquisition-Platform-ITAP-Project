import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { candidateOffersApi } from "../services/candidateApi.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

export function useCandidateOffersViewModel() {
  const queryClient = useQueryClient();
  const pushToast = useNotificationsStore((s) => s.pushToast);
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["candidate", "offers"] });
    queryClient.invalidateQueries({ queryKey: ["candidate", "applications"] });
  };

  const { data, isLoading } = useQuery({ queryKey: ["candidate", "offers"], queryFn: candidateOffersApi.list });

  const acceptMutation = useMutation({
    mutationFn: candidateOffersApi.accept,
    onSuccess: () => {
      invalidate();
      pushToast({ tone: "success", message: "Offer accepted. Congratulations!" });
    },
    onError: (err) => pushToast({ tone: "danger", message: err?.response?.data?.error?.message || "Could not accept." }),
  });

  const declineMutation = useMutation({
    mutationFn: candidateOffersApi.decline,
    onSuccess: () => {
      invalidate();
      pushToast({ tone: "info", message: "Offer declined." });
    },
    onError: (err) => pushToast({ tone: "danger", message: err?.response?.data?.error?.message || "Could not decline." }),
  });

  return {
    offers: data ?? [],
    isLoading,
    accept: acceptMutation.mutate,
    isAccepting: acceptMutation.isPending,
    decline: declineMutation.mutate,
    isDeclining: declineMutation.isPending,
    getDocumentUrl: candidateOffersApi.documentUrl,
  };
}
