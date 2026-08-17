import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { interviewsApi } from "../services/interviewsApi.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

export function useScheduleInterviewViewModel() {
  const { candidateId } = useParams();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");
  const navigate = useNavigate();
  const pushToast = useNotificationsStore((s) => s.pushToast);

  const scheduleMutation = useMutation({
    mutationFn: (payload) => interviewsApi.schedule({ candidateId, jobId, ...payload }),
    onSuccess: () => {
      pushToast({ tone: "success", message: "Interview scheduled." });
      navigate(`/candidates/${candidateId}`);
    },
    onError: () => pushToast({ tone: "danger", message: "Couldn't schedule the interview." }),
  });

  return { schedule: scheduleMutation.mutate, isScheduling: scheduleMutation.isPending };
}

export function useInterviewFeedbackViewModel() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const pushToast = useNotificationsStore((s) => s.pushToast);

  const submitMutation = useMutation({
    mutationFn: (payload) => interviewsApi.submitFeedback(interviewId, payload),
    onSuccess: () => {
      pushToast({ tone: "success", message: "Feedback submitted." });
      navigate(-1);
    },
  });

  return { submit: submitMutation.mutate, isSubmitting: submitMutation.isPending };
}
