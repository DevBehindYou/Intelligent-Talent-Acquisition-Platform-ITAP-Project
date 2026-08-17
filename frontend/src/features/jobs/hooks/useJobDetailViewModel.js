import { useQuery } from "@tanstack/react-query";
import { jobsApi } from "../services/jobsApi.js";

export function useJobDetailViewModel(jobId) {
  const { data: job, isLoading } = useQuery({
    queryKey: ["jobs", jobId],
    queryFn: () => jobsApi.get(jobId),
    enabled: !!jobId,
  });
  return { job, isLoading };
}
