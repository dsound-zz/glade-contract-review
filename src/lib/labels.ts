import type { Verdict, ClauseTypeValue } from "@/db/schema";

export const VERDICT_LABEL: Record<Verdict, string> = {
  acceptable: "Acceptable",
  attention: "Needs attention",
  unacceptable: "Unacceptable",
  missing: "Missing",
};

// Tailwind classes keyed to the semantic verdict colors in globals.css.
export const VERDICT_CLASSES: Record<Verdict, string> = {
  acceptable: "bg-ok-bg text-ok",
  attention: "bg-warn-bg text-warn",
  unacceptable: "bg-bad-bg text-bad",
  missing: "bg-miss-bg text-miss",
};

export const VERDICT_DOT: Record<Verdict, string> = {
  acceptable: "bg-ok",
  attention: "bg-warn",
  unacceptable: "bg-bad",
  missing: "bg-miss",
};

export const STATUS_LABEL: Record<string, string> = {
  uploaded: "Uploaded",
  extracting: "Analyzing…",
  extracted: "Extracted",
  in_review: "In review",
  completed: "Completed",
  failed: "Failed",
};

export const SEVERITY_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export function clauseTypeLabel(t: ClauseTypeValue | string): string {
  return t
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .replace(/\bIp\b/, "IP");
}

export const OBLIGATION_LABEL: Record<string, string> = {
  payment: "Payment",
  renewal: "Renewal",
  termination_notice: "Termination notice",
  deliverable: "Deliverable",
  reporting: "Reporting",
  audit: "Audit",
  data_deletion: "Data deletion",
  insurance: "Insurance",
  other: "Other",
};

// Ordering used to sort findings by importance in the review queue.
export const VERDICT_RANK: Record<Verdict, number> = {
  unacceptable: 0,
  missing: 1,
  attention: 2,
  acceptable: 3,
};

export const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};
