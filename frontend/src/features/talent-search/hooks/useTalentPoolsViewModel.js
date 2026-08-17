import { useQuery } from "@tanstack/react-query";
import { talentSearchApi } from "../services/talentSearchApi.js";

export function useTalentPoolsViewModel() {
  const { data, isLoading } = useQuery({ queryKey: ["talent-pools"], queryFn: talentSearchApi.listPools });
  return { pools: data ?? [], isLoading };
}
