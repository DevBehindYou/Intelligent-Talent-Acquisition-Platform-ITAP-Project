import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { candidateConversationsApi } from "../services/candidateApi.js";

export function useCandidateConversationsViewModel() {
  const { data, isLoading } = useQuery({
    queryKey: ["candidate", "conversations"],
    queryFn: candidateConversationsApi.list,
  });
  return { conversations: data ?? [], isLoading };
}

export function useCandidateThreadViewModel(conversationId) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["candidate", "conversation", conversationId],
    queryFn: () => candidateConversationsApi.thread(conversationId),
    enabled: Boolean(conversationId),
  });

  const sendMutation = useMutation({
    mutationFn: (body) => candidateConversationsApi.send(conversationId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "conversation", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "conversations"] });
    },
  });

  return {
    conversation: data?.conversation,
    messages: data?.messages ?? [],
    isLoading,
    send: sendMutation.mutate,
    isSending: sendMutation.isPending,
  };
}
