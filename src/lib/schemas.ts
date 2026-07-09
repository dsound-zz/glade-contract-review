import { z } from "zod";
import { clauseType, obligationType } from "@/db/schema";

// Normalize a model-provided label ("Limitation of Liability", "non-compete")
// toward our snake_case enum tokens before matching.
function normalizeToken(v: unknown): unknown {
  if (typeof v !== "string") return v;
  return v.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

/**
 * A single stray enum value must not discard an otherwise-valid extraction.
 * We normalize, then fall back to a safe default when the model returns a
 * value outside our vocabulary — degrading one field gracefully instead of
 * failing the whole document.
 */
const clauseTypeEnum = z.preprocess(
  normalizeToken,
  z.enum(clauseType.enumValues).catch("other"),
);
const obligationTypeEnum = z.preprocess(
  normalizeToken,
  z.enum(obligationType.enumValues).catch("other"),
);

/* --------------------------- Extraction (call 1) -------------------------- */

export const clauseExtractionSchema = z.object({
  clauseType: clauseTypeEnum,
  heading: z.string().nullable().optional(),
  // The model must copy this verbatim from the contract; we verify it after.
  quote: z.string().min(1),
});

export const obligationExtractionSchema = z.object({
  description: z.string().min(1),
  obligationType: obligationTypeEnum,
  responsibleParty: z.string().nullable().optional(),
  // Relative timing, e.g. "90 days before renewal".
  trigger: z.string().nullable().optional(),
  // Absolute date as ISO (YYYY-MM-DD) when derivable, else null.
  dueDate: z.string().nullable().optional(),
  quote: z.string().nullable().optional(),
});

export const extractionSchema = z.object({
  clauses: z.array(clauseExtractionSchema).default([]),
  obligations: z.array(obligationExtractionSchema).default([]),
});

export type ExtractionResult = z.infer<typeof extractionSchema>;
export type ClauseExtraction = z.infer<typeof clauseExtractionSchema>;

/* --------------------------- Assessment (call 2) -------------------------- */

// The model only assigns these three; "missing" findings are derived in code.
export const assessmentItemSchema = z.object({
  clauseIndex: z.number().int().nonnegative(),
  // Fall back to the neutral middle verdict if the model returns an odd value.
  verdict: z.preprocess(
    normalizeToken,
    z.enum(["acceptable", "attention", "unacceptable"]).catch("attention"),
  ),
  rationale: z.string().min(1),
  suggestion: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).default(0.5),
});

export const assessmentResultSchema = z.object({
  assessments: z.array(assessmentItemSchema).default([]),
});

export type AssessmentResult = z.infer<typeof assessmentResultSchema>;
export type AssessmentItem = z.infer<typeof assessmentItemSchema>;
