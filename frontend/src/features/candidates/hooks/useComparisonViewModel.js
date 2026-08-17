import { useSearchParams } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { candidatesApi } from "../services/candidatesApi.js";

export function useComparisonViewModel() {
  const [searchParams] = useSearchParams();
  const ids = (searchParams.get("ids") || "").split(",").filter(Boolean);

  const results = useQueries({
    queries: ids.map((id) => ({ queryKey: ["candidates", id], queryFn: () => candidatesApi.get(id) })),
  });

  return {
    candidates: results.map((r) => r.data).filter(Boolean),
    isLoading: results.some((r) => r.isLoading),
  };
}
