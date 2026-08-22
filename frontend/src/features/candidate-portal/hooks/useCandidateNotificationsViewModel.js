import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { candidateNotificationsApi } from "../services/candidateApi.js";

export function useCandidateNotificationsViewModel() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["candidate", "notifications"] });

  const { data, isLoading } = useQuery({
    queryKey: ["candidate", "notifications"],
    queryFn: candidateNotificationsApi.list,
  });

  const markReadMutation = useMutation({ mutationFn: candidateNotificationsApi.markRead, onSuccess: invalidate });
  const markAllMutation = useMutation({ mutationFn: candidateNotificationsApi.markAllRead, onSuccess: invalidate });

  return {
    notifications: data?.items ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    markRead: markReadMutation.mutate,
    markAllRead: markAllMutation.mutate,
  };
}
