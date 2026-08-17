import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { candidatesApi } from "../services/candidatesApi.js";
import { useDebounce } from "../../../shared/hooks/useDebounce.js";

export function useCandidateListViewModel() {
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState([]);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ["candidates", { search: debouncedSearch, skills: skillFilter }],
    queryFn: () => candidatesApi.list({ search: debouncedSearch, skills: skillFilter.join(",") || undefined }),
  });

  return {
    candidates: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    search,
    setSearch,
    skillFilter,
    setSkillFilter,
  };
}
