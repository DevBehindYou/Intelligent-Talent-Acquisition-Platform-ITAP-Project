import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { talentSearchApi } from "../services/talentSearchApi.js";
import { useDebounce } from "../../../shared/hooks/useDebounce.js";
import { useEffect } from "react";

const DEFAULT_WEIGHTS = {
  technicalDepth: 85,
  experienceLevel: 60,
  skillRecency: 40,
  domainExpertise: 75,
  culturalFit: 25,
};

export function useTalentSearchViewModel() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [parsedFilters, setParsedFilters] = useState(null);
  const [results, setResults] = useState([]);

  const searchMutation = useMutation({
    mutationFn: () => talentSearchApi.search(query, weights),
    onSuccess: (data) => {
      setParsedFilters(data.parsedFilters);
      setResults(data.results);
    },
  });

  // Live-preview: re-run search as sliders move, matching the design's "Live Impact
  // Preview" panel (docs/design-reference/ai_search_configuration). Debounced so we don't
  // fire a request per pixel of drag.
  const debouncedWeights = useDebounce(weights, 400);
  useEffect(() => {
    if (query.trim()) searchMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedWeights]);

  function updateWeight(key, value) {
    setWeights((prev) => ({ ...prev, [key]: value }));
  }

  function removeFilter(category, value) {
    setParsedFilters((prev) => ({
      ...prev,
      [category]: prev[category].filter((v) => v !== value),
    }));
  }

  return {
    query,
    setQuery,
    weights,
    updateWeight,
    search: searchMutation.mutate,
    isSearching: searchMutation.isPending,
    parsedFilters,
    removeFilter,
    results,
  };
}
