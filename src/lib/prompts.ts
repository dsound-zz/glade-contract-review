import { clauseType, obligationType } from "@/db/schema";
import type { PlaybookRule, Clause } from "@/db/schema";

const CLAUSE_TYPES = clauseType.enumValues.join(", ");
const OBLIGATION_TYPES = obligationType.enumValues.join(", ");

/* ------------------------------- Extraction ------------------------------- */

export function extractionMessages(rawText: string) {
  const system = `You are a contract analyst for an in-house legal team. You extract structured data from an inbound vendor contract. You never invent text: every "quote" you return must be copied VERBATIM from the contract, character-for-character, so it can be located in the source.

Return JSON with this shape:
{
  "clauses": [
    { "clauseType": one of [${CLAUSE_TYPES}], "heading": string or null, "quote": string (verbatim excerpt, <= 4 sentences) }
  ],
  "obligations": [
    { "description": string, "obligationType": one of [${OBLIGATION_TYPES}], "responsibleParty": "us" | "counterparty" | "both" | null, "trigger": string or null, "dueDate": "YYYY-MM-DD" or null, "quote": verbatim excerpt or null }
  ]
}

Rules:
- Identify each substantive clause and map it to the closest clauseType. Use "other" only when nothing fits.
- One clause per distinct provision. Do not merge unrelated provisions.
- "quote" must be an exact substring of the contract (you may include the section heading and text). Do not paraphrase, fix typos, or add ellipses.
- Obligations are post-signing commitments a party must track: payment due dates, renewal/non-renewal notice windows, deletion timelines, reporting, audits, insurance to maintain. Capture the timing in "trigger" (relative) or "dueDate" (absolute) — leave both null if none is stated.
- Output ONLY the JSON object.`;

  const user = `CONTRACT:\n"""\n${rawText}\n"""`;
  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

/* ------------------------------- Assessment ------------------------------- */

function renderPlaybook(rules: PlaybookRule[]): string {
  return rules
    .map(
      (r) =>
        `### ${r.clauseType} — ${r.title} (severity: ${r.severity})
- Standard position: ${r.standardPosition}
- Acceptable fallback: ${r.fallbackPosition}
- Walk-away (unacceptable): ${r.walkAway}
- Guidance: ${r.guidance}`,
    )
    .join("\n\n");
}

export function assessmentMessages(
  clauses: Pick<Clause, "clauseType" | "extractedText">[],
  rules: PlaybookRule[],
) {
  const numbered = clauses
    .map(
      (c, i) =>
        `[${i}] clauseType=${c.clauseType}\n"""${c.extractedText}"""`,
    )
    .join("\n\n");

  const system = `You are a contract reviewer. You assess each extracted clause STRICTLY against the firm's playbook below. You do not apply your own risk appetite — the playbook defines what is acceptable, a tolerable fallback, and a walk-away.

For each clause, assign:
- "verdict": "acceptable" (meets standard or fallback), "attention" (deviates but negotiable / a fallback the firm should consciously accept), or "unacceptable" (matches a walk-away condition or is materially worse than the fallback).
- "rationale": 1-3 sentences citing the specific playbook position and the specific contract language that drives the verdict.
- "suggestion": concrete redline / negotiation language to bring the clause in line, or null if acceptable.
- "confidence": 0.0-1.0 — how confident you are, lower it when the clause is ambiguous.

Return JSON: { "assessments": [ { "clauseIndex": number, "verdict": ..., "rationale": ..., "suggestion": ..., "confidence": ... } ] }
Assess every clause exactly once, by its index. Output ONLY the JSON object.

PLAYBOOK:
${renderPlaybook(rules)}`;

  const user = `CLAUSES TO ASSESS:\n\n${numbered}`;
  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}
