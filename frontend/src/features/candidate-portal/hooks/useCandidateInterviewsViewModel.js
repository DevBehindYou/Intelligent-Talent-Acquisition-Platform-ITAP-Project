import { useQuery } from "@tanstack/react-query";
import { candidateInterviewsApi } from "../services/candidateApi.js";

export function useCandidateInterviewsViewModel() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["candidate", "interviews"],
    queryFn: candidateInterviewsApi.list,
  });
  return { interviews: data ?? [], isLoading, isError };
}
