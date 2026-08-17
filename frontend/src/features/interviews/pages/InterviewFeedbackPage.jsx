import { useState } from "react";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Textarea from "../../../shared/components/Textarea.jsx";
import Button from "../../../shared/components/Button.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import { useInterviewFeedbackViewModel } from "../hooks/useInterviewViewModel.js";

export default function InterviewFeedbackPage() {
  const { submit, isSubmitting } = useInterviewFeedbackViewModel();
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");

  return (
    <div>
      <PageHeader title="Interview feedback" subtitle="Structured feedback helps the hiring manager decide faster." />
      <form className="max-w-md flex flex-col gap-md" onSubmit={(e) => (e.preventDefault(), submit({ rating, comments }))}>
        <div>
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">Overall rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>
                <Icon name={n <= rating ? "star" : "star_border"} className={n <= rating ? "text-secondary" : "text-outline"} />
              </button>
            ))}
          </div>
        </div>
        <Textarea label="Comments" value={comments} onChange={(e) => setComments(e.target.value)} rows={6} />
        <Button type="submit" isLoading={isSubmitting}>
          Submit feedback
        </Button>
      </form>
    </div>
  );
}
