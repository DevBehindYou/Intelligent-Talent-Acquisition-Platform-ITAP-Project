// Maps the canonical Application.status to a Badge tone for the candidate views.
const STATUS_TONE = {
  applied: "neutral",
  screened: "active",
  shortlisted: "active",
  interviewing: "warning",
  offer: "success",
  hired: "success",
  rejected: "danger",
  withdrawn: "neutral",
};

export function statusTone(status) {
  return STATUS_TONE[status] || "neutral";
}
