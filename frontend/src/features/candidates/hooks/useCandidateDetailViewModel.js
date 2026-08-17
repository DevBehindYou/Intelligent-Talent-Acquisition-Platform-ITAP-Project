import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useParams } from "react-router-dom";
import { candidatesApi } from "../services/candidatesApi.js";
import { matchingApi } from "../../matching/services/matchingApi.js";
import { useUiStore } from "../../../shared/store/uiStore.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

export function useCandidateDetailViewModel() {
  const { candidateId } = useParams();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");
  const queryClient = useQueryClient();
  const openCopilot = useUiStore((s) => s.openCopilot);
  const pushToast = useNotificationsStore((s) => s.pushToast);

  const { data: candidate, isLoading } = useQuery({
    queryKey: ["candidates", candidateId],
    queryFn: () => candidatesApi.get(candidateId),
    enabled: !!candidateId,
  });

  const { data: explanation } = useQuery({
    queryKey: ["candidates", candidateId, "explanation", jobId],
    queryFn: () => matchingApi.explanation(jobId, candidateId),
    enabled: !!candidateId && !!jobId,
  });

  const { data: questions } = useQuery({
    queryKey: ["candidates", candidateId, "questions", jobId],
    queryFn: () => candidatesApi.questions(candidateId, jobId),
    enabled: !!candidateId && !!jobId,
  });

  const moveStageMutation = useMutation({
    mutationFn: (stage) => candidatesApi.moveStage(candidateId, { jobId, stage }),
    onSuccess: (_, stage) => {
      queryClient.invalidateQueries({ queryKey: ["candidates", candidateId] });
      pushToast({ tone: "success", message: `Moved to "${stage}".` });
    },
  });

  function openCopilotForCandidate() {
    openCopilot({ candidateId, candidateName: candidate?.fullName, jobId });
  }

  return {
    candidate,
    isLoading,
    explanation,
    questions: questions ?? [],
    jobId,
    moveStage: moveStageMutation.mutate,
    isMovingStage: moveStageMutation.isPending,
    openCopilotForCandidate,
  };
}
