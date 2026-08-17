import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../services/analyticsApi.js";

export function useAnalyticsViewModel() {
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: analyticsApi.dashboard,
  });
  const { data: timeToHire, isLoading: isLoadingTrend } = useQuery({
    queryKey: ["analytics", "time-to-hire"],
    queryFn: analyticsApi.timeToHire,
  });
  const { data: skillDemand, isLoading: isLoadingSkills } = useQuery({
    queryKey: ["analytics", "skill-demand"],
    queryFn: analyticsApi.skillDemand,
  });

  return {
    summary,
    timeToHire: timeToHire ?? [],
    skillDemand: skillDemand ?? [],
    isLoading: isLoadingSummary || isLoadingTrend || isLoadingSkills,
  };
}
