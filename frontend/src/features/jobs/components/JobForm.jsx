import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../../shared/components/Input.jsx";
import Textarea from "../../../shared/components/Textarea.jsx";
import Select from "../../../shared/components/Select.jsx";
import Button from "../../../shared/components/Button.jsx";
import SkillTagInput from "./SkillTagInput.jsx";
import { useJobFormViewModel } from "../hooks/useJobFormViewModel.js";

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "contract", label: "Contract" },
  { value: "remote", label: "Remote" },
];

const DEFAULT_FORM = {
  title: "",
  department: "",
  description: "",
  requiredSkills: [],
  niceToHaveSkills: [],
  experienceMin: 0,
  experienceMax: 5,
  location: "",
  employmentType: "full_time",
};

export default function JobForm() {
  const navigate = useNavigate();
  const { isEditing, existingJob, save, isSaving } = useJobFormViewModel();
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (existingJob) setForm({ ...DEFAULT_FORM, ...existingJob });
  }, [existingJob]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e, status) {
    e.preventDefault();
    save({ ...form, status });
  }

  const canPublish = form.title && form.requiredSkills.length > 0;

  return (
    <form className="flex flex-col gap-lg max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
        <Input label="Job title" value={form.title} onChange={(e) => update("title", e.target.value)} required />
        <Input label="Department" value={form.department} onChange={(e) => update("department", e.target.value)} />
      </div>

      <Textarea
        label="Description"
        rows={6}
        value={form.description}
        onChange={(e) => update("description", e.target.value)}
        placeholder="Role summary, responsibilities, what success looks like…"
      />

      <SkillTagInput
        label="Required skills"
        skills={form.requiredSkills}
        onChange={(skills) => update("requiredSkills", skills)}
        withWeight
      />
      <SkillTagInput
        label="Nice-to-have skills"
        skills={form.niceToHaveSkills}
        onChange={(skills) => update("niceToHaveSkills", skills)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        <Input
          label="Min. experience (yrs)"
          type="number"
          min={0}
          value={form.experienceMin}
          onChange={(e) => update("experienceMin", Number(e.target.value))}
        />
        <Input
          label="Max. experience (yrs)"
          type="number"
          min={0}
          value={form.experienceMax}
          onChange={(e) => update("experienceMax", Number(e.target.value))}
        />
        <Select
          label="Employment type"
          options={EMPLOYMENT_TYPES}
          value={form.employmentType}
          onChange={(e) => update("employmentType", e.target.value)}
        />
      </div>

      <Input label="Location" value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Remote, Bengaluru, Hybrid…" />

      <div className="flex items-center gap-sm pt-sm hairline-b border-t -mx-lg px-lg pb-0" />
      <div className="flex items-center justify-end gap-sm">
        <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button variant="secondary" isLoading={isSaving} onClick={(e) => handleSubmit(e, "draft")}>
          Save as draft
        </Button>
        <Button variant="primary" isLoading={isSaving} disabled={!canPublish} onClick={(e) => handleSubmit(e, "open")}>
          {isEditing ? "Save & publish" : "Publish job"}
        </Button>
      </div>
    </form>
  );
}
