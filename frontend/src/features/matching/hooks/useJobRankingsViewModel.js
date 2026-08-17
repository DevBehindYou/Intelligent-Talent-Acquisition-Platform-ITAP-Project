import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { matchingApi } from "../services/matchingApi.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

export function useJobRankingsViewModel(jobId) {
  const [sortBy, setSortBy] = useState("overallScore");
  const queryClient = useQueryClient();
  const pushToast = useNotificationsStore((s) => s.pushToast);

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", jobId, "rankings", { sortBy }],
    queryFn: () => matchingApi.rankings(jobId, { sortBy, order: "desc" }),
    enabled: !!jobId,
  });

  const recomputeMutation = useMutation({
    mutationFn: () => matchingApi.recompute(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", jobId, "rankings"] });
      pushToast({ tone: "success", message: "Re-scoring started — rankings will update live." });
    },
  });

  return {
    rankings: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    sortBy,
    setSortBy,
    recompute: recomputeMutation.mutate,
    isRecomputing: recomputeMutation.isPending,
  };
}
