import { useEffect } from "react";
import { useForm } from "react-hook-form";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Input from "../../../shared/components/Input.jsx";
import Textarea from "../../../shared/components/Textarea.jsx";
import Button from "../../../shared/components/Button.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { useCandidateProfileViewModel } from "../hooks/useCandidateProfileViewModel.js";

const toCsv = (arr, key) => (arr || []).map((x) => (key ? x[key] : x)).filter(Boolean).join(", ");
const fromCsv = (str) => (str || "").split(",").map((s) => s.trim()).filter(Boolean);

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-outline-variant/40 bg-paper p-lg">
      <h2 className="font-display-sm text-display-sm text-on-surface mb-md">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">{children}</div>
    </div>
  );
}

export default function CandidateProfilePage() {
  const { profile, completionPct, isLoading, update, isSaving } = useCandidateProfileViewModel();
  const { register, handleSubmit, reset } = useForm();

  // Populate the form once the profile loads.
  useEffect(() => {
    if (!profile) return;
    reset({
      fullName: profile.fullName || "",
      headline: profile.headline || "",
      location: profile.location || "",
      phone: profile.phone || "",
      summary: profile.summary || "",
      skills: toCsv(profile.skills, "name"),
      linkedin: profile.links?.linkedin || "",
      github: profile.links?.github || "",
      portfolio: profile.links?.portfolio || "",
      roles: toCsv(profile.preferences?.roles),
      salaryMin: profile.preferences?.salaryExpectation?.min || "",
      salaryMax: profile.preferences?.salaryExpectation?.max || "",
    });
  }, [profile, reset]);

  function onSubmit(values) {
    update({
      fullName: values.fullName,
      headline: values.headline,
      location: values.location,
      phone: values.phone,
      summary: values.summary,
      skills: fromCsv(values.skills).map((name) => ({ name })),
      links: { linkedin: values.linkedin, github: values.github, portfolio: values.portfolio },
      preferences: {
        roles: fromCsv(values.roles),
        salaryExpectation: {
          min: values.salaryMin ? Number(values.salaryMin) : undefined,
          max: values.salaryMax ? Number(values.salaryMax) : undefined,
          currency: "USD",
        },
      },
    });
  }

  if (isLoading) return <SkeletonCard />;

  return (
    <div>
      <PageHeader title="My profile" subtitle={`${completionPct}% complete — a fuller profile stands out.`} />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-lg">
        <Section title="Basic information">
          <Input label="Full name" {...register("fullName")} />
          <Input label="Professional headline" placeholder="Senior Frontend Engineer" {...register("headline")} />
          <Input label="Location" leftIcon="place" {...register("location")} />
          <Input label="Phone" leftIcon="call" {...register("phone")} />
          <div className="md:col-span-2">
            <Textarea label="Career summary" rows={4} {...register("summary")} />
          </div>
        </Section>

        <Section title="Skills & links">
          <div className="md:col-span-2">
            <Input label="Skills (comma separated)" placeholder="React, Node.js, SQL" {...register("skills")} />
          </div>
          <Input label="LinkedIn" leftIcon="link" {...register("linkedin")} />
          <Input label="GitHub" leftIcon="link" {...register("github")} />
          <Input label="Portfolio" leftIcon="link" {...register("portfolio")} />
        </Section>

        <Section title="Job preferences">
          <div className="md:col-span-2">
            <Input label="Preferred roles (comma separated)" placeholder="Frontend Engineer, Full-stack" {...register("roles")} />
          </div>
          <Input label="Salary expectation — min (USD)" type="number" {...register("salaryMin")} />
          <Input label="Salary expectation — max (USD)" type="number" {...register("salaryMax")} />
        </Section>

        <div className="flex justify-end">
          <Button type="submit" size="lg" leftIcon="save" isLoading={isSaving}>
            Save profile
          </Button>
        </div>
      </form>
    </div>
  );
}
