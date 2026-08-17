import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../services/analyticsApi.js";
import { jobsApi } from "../../jobs/services/jobsApi.js";
import { useAuthStore } from "../../auth/store/authStore.js";

export function useDashboardViewModel() {
  const user = useAuthStore((s) => s.user);
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: analyticsApi.dashboard,
  });
  const { data: jobsData, isLoading: isLoadingJobs } = useQuery({
    queryKey: ["jobs", { status: "open", limit: 5 }],
    queryFn: () => jobsApi.list({ status: "open", pageSize: 5 }),
  });

  return {
    user,
    summary,
    isLoadingSummary,
    jobs: jobsData?.items ?? [],
    isLoadingJobs,
  };
}
