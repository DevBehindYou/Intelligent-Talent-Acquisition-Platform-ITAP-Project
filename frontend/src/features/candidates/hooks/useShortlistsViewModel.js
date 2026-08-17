import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { candidatesApi } from "../services/candidatesApi.js";

export function useShortlistsViewModel() {
  const [selected, setSelected] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ["candidates", { stage: "shortlisted", scope: "mine" }],
    queryFn: () => candidatesApi.list({ stage: "shortlisted", scope: "mine" }),
  });

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev));
  }

  return { candidates: data?.items ?? [], isLoading, selected, toggle };
}
