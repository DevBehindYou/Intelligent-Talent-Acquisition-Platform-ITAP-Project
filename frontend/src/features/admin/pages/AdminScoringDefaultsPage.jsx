import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Button from "../../../shared/components/Button.jsx";
import WeightSliders from "../../matching/components/WeightSliders.jsx";
import { adminApi } from "../services/adminApi.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

const DEFAULT_WEIGHTS = { skillsWeight: 0.4, experienceWeight: 0.3, educationWeight: 0.15, domainWeight: 0.15 };

export default function AdminScoringDefaultsPage() {
  const pushToast = useNotificationsStore((s) => s.pushToast);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const { data } = useQuery({ queryKey: ["admin", "scoring-defaults"], queryFn: adminApi.getScoringDefaults });

  useEffect(() => {
    if (data) setWeights(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => adminApi.updateScoringDefaults(weights),
    onSuccess: () => pushToast({ tone: "success", message: "Org-wide scoring defaults updated." }),
  });

  function updateWeight(key, value) {
    const otherKeys = Object.keys(weights).filter((k) => k !== key);
    const remaining = 1 - value;
    const currentOthersTotal = otherKeys.reduce((sum, k) => sum + weights[k], 0) || 1;
    const next = { [key]: value };
    otherKeys.forEach((k) => (next[k] = Math.max(0, (weights[k] / currentOthersTotal) * remaining)));
    setWeights(next);
  }

  return (
    <div>
      <PageHeader title="Org-wide scoring defaults" subtitle="New jobs inherit these weights unless a recruiter overrides them per-job." />
      <div className="max-w-md rounded-xl border border-outline-variant/40 bg-paper p-md">
        <WeightSliders weights={weights} onChange={updateWeight} />
        <Button className="mt-md" isLoading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          Save defaults
        </Button>
      </div>
    </div>
  );
}
