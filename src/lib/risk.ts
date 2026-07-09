import type { Verdict } from "@/db/schema";

/**
 * Risk scoring. Deliberately simple and transparent so a reviewer can predict
 * it: each finding contributes (severity weight x verdict penalty), and the
 * score is that sum normalized against the worst case (every finding at its
 * severity, fully unacceptable). Range 0-100.
 */

export const SEVERITY_WEIGHT: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 4,
  critical: 8,
};

export const VERDICT_PENALTY: Record<Verdict, number> = {
  acceptable: 0,
  attention: 0.4,
  unacceptable: 1,
  // A missing required clause is serious but slightly less certain than an
  // explicitly unacceptable term the counterparty actually wrote down.
  missing: 0.7,
};

export type RiskInput = { severity: string; verdict: Verdict };

export function computeRiskScore(findings: RiskInput[]): number {
  if (findings.length === 0) return 0;
  let raw = 0;
  let max = 0;
  for (const f of findings) {
    const w = SEVERITY_WEIGHT[f.severity] ?? 2;
    raw += w * (VERDICT_PENALTY[f.verdict] ?? 0);
    max += w; // worst case: this finding fully unacceptable
  }
  if (max === 0) return 0;
  return Math.round((raw / max) * 100);
}

export function riskBand(score: number): "low" | "moderate" | "high" {
  if (score >= 50) return "high";
  if (score >= 20) return "moderate";
  return "low";
}

/** Human decision wins over the AI's when present. */
export function effectiveVerdict(a: {
  aiVerdict: Verdict;
  humanVerdict: Verdict | null;
}): Verdict {
  return a.humanVerdict ?? a.aiVerdict;
}
