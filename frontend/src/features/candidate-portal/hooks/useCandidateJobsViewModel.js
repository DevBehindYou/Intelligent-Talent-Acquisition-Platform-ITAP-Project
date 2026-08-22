import { useQuery } from "@tanstack/react-query";
import { candidateJobsApi } from "../services/candidateApi.js";

export function useCandidateJobsViewModel(filters = {}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["candidate", "jobs", filters],
    queryFn: () => candidateJobsApi.list(filters),
  });
  return { jobs: data?.items ?? [], total: data?.total ?? 0, isLoading, isError };
}

export function useCandidateJobDetailViewModel(jobId) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["candidate", "job", jobId],
    queryFn: () => candidateJobsApi.get(jobId),
    enabled: Boolean(jobId),
  });
  return { job: data, isLoading, isError };
}
