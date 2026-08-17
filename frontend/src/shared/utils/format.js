export function formatDate(value, options = { year: "numeric", month: "short", day: "numeric" }) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", options);
}

export function formatScore(value) {
  if (value === null || value === undefined) return "—";
  return Math.round(value);
}

export function initials(fullName = "") {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function truncate(text = "", max = 90) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
