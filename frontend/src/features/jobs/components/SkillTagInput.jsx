import { useState } from "react";
import Icon from "../../../shared/components/Icon.jsx";

/**
 * Required/nice-to-have skill entry with a per-tag weight slider — docs/07 §3.4 (JobForm),
 * docs/02-database-schema.md §2.3 (`requiredSkills: [{ name, weight, mustHave }]`).
 */
export default function SkillTagInput({ label, skills, onChange, withWeight = false }) {
  const [draft, setDraft] = useState("");

  function addSkill() {
    if (!draft.trim()) return;
    const next = withWeight
      ? [...skills, { name: draft.trim(), weight: 0.2, mustHave: false }]
      : [...skills, draft.trim()];
    onChange(next);
    setDraft("");
  }

  function removeSkill(index) {
    onChange(skills.filter((_, i) => i !== index));
  }

  function updateWeight(index, weight) {
    onChange(skills.map((s, i) => (i === index ? { ...s, weight } : s)));
  }

  function toggleMustHave(index) {
    onChange(skills.map((s, i) => (i === index ? { ...s, mustHave: !s.mustHave } : s)));
  }

  return (
    <div className="flex flex-col gap-sm">
      <label className="font-label-caps text-label-caps text-on-surface-variant uppercase">{label}</label>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
          placeholder="Type a skill and press Enter"
          className="flex-1 h-9 rounded border border-outline-variant/60 px-sm text-body-md outline-none focus:border-prussian"
        />
        <button type="button" onClick={addSkill} className="w-9 h-9 rounded bg-surface-container-low text-on-surface flex items-center justify-center">
          <Icon name="add" size={18} />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {skills.map((skill, i) => {
          const name = withWeight ? skill.name : skill;
          return (
            <div key={`${name}-${i}`} className="flex items-center gap-sm bg-surface-container-low rounded px-sm py-2">
              <span className="text-body-sm text-on-surface flex-1">{name}</span>
              {withWeight && (
                <>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={skill.weight}
                    onChange={(e) => updateWeight(i, Number(e.target.value))}
                    className="w-24 accent-prussian"
                    aria-label={`Weight for ${name}`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleMustHave(i)}
                    className={`text-body-sm px-2 py-1 rounded border ${
                      skill.mustHave ? "bg-prussian text-white border-prussian" : "text-on-surface-variant border-outline-variant/50"
                    }`}
                  >
                    Must-have
                  </button>
                </>
              )}
              <button type="button" onClick={() => removeSkill(i)} aria-label={`Remove ${name}`} className="text-outline hover:text-danger">
                <Icon name="close" size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
