import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { jobsApi } from "../services/jobsApi.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

export function useJobFormViewModel() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pushToast = useNotificationsStore((s) => s.pushToast);
  const isEditing = !!jobId;

  const { data: existingJob, isLoading: isLoadingJob } = useQuery({
    queryKey: ["jobs", jobId],
    queryFn: () => jobsApi.get(jobId),
    enabled: isEditing,
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => (isEditing ? jobsApi.update(jobId, payload) : jobsApi.create(payload)),
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      pushToast({ tone: "success", message: isEditing ? "Job updated." : "Job created." });
      navigate(`/jobs/${job._id}`);
    },
    onError: () => pushToast({ tone: "danger", message: "Couldn't save the job. Check the form and try again." }),
  });

  return {
    isEditing,
    existingJob,
    isLoadingJob,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}
