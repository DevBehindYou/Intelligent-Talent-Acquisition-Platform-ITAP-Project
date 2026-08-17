import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { jobsApi } from "../services/jobsApi.js";
import { useDebounce } from "../../../shared/hooks/useDebounce.js";

export function useJobListViewModel() {
  const [status, setStatus] = useState("open");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", { status, search: debouncedSearch }],
    queryFn: () => jobsApi.list({ status: status === "all" ? undefined : status, search: debouncedSearch }),
  });

  return {
    jobs: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    status,
    setStatus,
    search,
    setSearch,
  };
}
