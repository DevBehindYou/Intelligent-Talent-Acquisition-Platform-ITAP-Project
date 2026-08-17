import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { jobsApi } from "../../jobs/services/jobsApi.js";
import { matchingApi } from "../services/matchingApi.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

const DEFAULT_WEIGHTS = { skillsWeight: 0.4, experienceWeight: 0.3, educationWeight: 0.15, domainWeight: 0.15 };

export function useScoringConfigViewModel(jobId) {
  const pushToast = useNotificationsStore((s) => s.pushToast);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);

  const { data: job } = useQuery({ queryKey: ["jobs", jobId], queryFn: () => jobsApi.get(jobId), enabled: !!jobId });

  useEffect(() => {
    if (job?.scoringWeights) setWeights(job.scoringWeights);
  }, [job]);

  // Adjusting one slider proportionally redistributes the rest so the total stays 100%,
  // unless the user has pinned other values — docs/07 §6, WeightSliders.
  function updateWeight(key, value) {
    const otherKeys = Object.keys(weights).filter((k) => k !== key);
    const remaining = 1 - value;
    const currentOthersTotal = otherKeys.reduce((sum, k) => sum + weights[k], 0) || 1;
    const next = { [key]: value };
    otherKeys.forEach((k) => {
      next[k] = Math.max(0, (weights[k] / currentOthersTotal) * remaining);
    });
    setWeights(next);
  }

  const saveMutation = useMutation({
    mutationFn: () => matchingApi.updateWeights(jobId, weights),
    onSuccess: () => pushToast({ tone: "success", message: "Scoring weights updated. Rankings will recompute." }),
    onError: () => pushToast({ tone: "danger", message: "Couldn't save scoring weights." }),
  });

  return { weights, updateWeight, save: saveMutation.mutate, isSaving: saveMutation.isPending };
}
