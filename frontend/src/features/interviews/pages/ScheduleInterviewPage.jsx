import { useState } from "react";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Input from "../../../shared/components/Input.jsx";
import Textarea from "../../../shared/components/Textarea.jsx";
import Button from "../../../shared/components/Button.jsx";
import { useScheduleInterviewViewModel } from "../hooks/useInterviewViewModel.js";

export default function ScheduleInterviewPage() {
  const { schedule, isScheduling } = useScheduleInterviewViewModel();
  const [form, setForm] = useState({ scheduledAt: "", notes: "" });

  return (
    <div>
      <PageHeader title="Schedule interview" subtitle="Set a time and add any prep notes for the interviewers." />
      <form
        className="max-w-md flex flex-col gap-md"
        onSubmit={(e) => (e.preventDefault(), schedule(form))}
      >
        <Input
          label="Date & time"
          type="datetime-local"
          value={form.scheduledAt}
          onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
          required
        />
        <Textarea
          label="Notes for interviewers"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={4}
        />
        <Button type="submit" isLoading={isScheduling}>
          Schedule interview
        </Button>
      </form>
    </div>
  );
}
