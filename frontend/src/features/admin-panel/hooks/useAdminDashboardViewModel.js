import { useQuery } from "@tanstack/react-query";
import { adminDashboardApi } from "../services/adminPanelApi.js";

export function useAdminDashboardViewModel() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: adminDashboardApi.get,
  });
  return { metrics: data, isLoading, isError };
}
