import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pipelineApi } from "../services/pipelineApi.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

export function usePipelineViewModel(jobId) {
  const [selectedIds, setSelectedIds] = useState([]);
  const queryClient = useQueryClient();
  const pushToast = useNotificationsStore((s) => s.pushToast);

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", jobId, "pipeline"],
    queryFn: () => pipelineApi.list(jobId),
    enabled: !!jobId,
  });

  const bulkMoveMutation = useMutation({
    mutationFn: (stage) => pipelineApi.bulkMoveStage(selectedIds, { jobId, stage }),
    onSuccess: (_, stage) => {
      queryClient.invalidateQueries({ queryKey: ["jobs", jobId, "pipeline"] });
      pushToast({ tone: "success", message: `Moved ${selectedIds.length} candidate(s) to "${stage}".` });
      setSelectedIds([]);
    },
    onError: () => pushToast({ tone: "danger", message: "Couldn't update stage for the selected candidates." }),
  });

  function toggleSelect(candidateId) {
    setSelectedIds((prev) => (prev.includes(candidateId) ? prev.filter((id) => id !== candidateId) : [...prev, candidateId]));
  }

  function toggleSelectAll() {
    const allIds = (data?.items ?? []).map((c) => c.candidateId || c._id);
    setSelectedIds((prev) => (prev.length === allIds.length ? [] : allIds));
  }

  return {
    candidates: data?.items ?? [],
    isLoading,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    bulkMoveStage: bulkMoveMutation.mutate,
    isMoving: bulkMoveMutation.isPending,
  };
}
