import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { candidateResumeApi } from "../services/candidateApi.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

export function useCandidateResumesViewModel() {
  const queryClient = useQueryClient();
  const pushToast = useNotificationsStore((s) => s.pushToast);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["candidate", "resumes"] });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["candidate", "resumes"],
    queryFn: candidateResumeApi.list,
  });

  const uploadMutation = useMutation({
    mutationFn: (file) => candidateResumeApi.upload(file),
    onSuccess: () => {
      invalidate();
      pushToast({ tone: "success", message: "Resume uploaded." });
    },
    onError: (err) => {
      pushToast({ tone: "danger", message: err?.response?.data?.error?.message || "Upload failed." });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: candidateResumeApi.setPrimary,
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: candidateResumeApi.remove,
    onSuccess: () => {
      invalidate();
      pushToast({ tone: "info", message: "Resume removed." });
    },
  });

  return {
    resumes: data ?? [],
    isLoading,
    isError,
    upload: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    setPrimary: setPrimaryMutation.mutate,
    remove: removeMutation.mutate,
    getDownloadUrl: candidateResumeApi.downloadUrl,
  };
}
