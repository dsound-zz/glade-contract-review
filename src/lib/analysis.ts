import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  contracts,
  clauses,
  assessments,
  obligations,
  playbookRules,
} from "@/db/schema";
import type { PlaybookRule } from "@/db/schema";
import { chatJson } from "./together";
import { extractionMessages, assessmentMessages } from "./prompts";
import { extractionSchema, assessmentResultSchema } from "./schemas";
import { locateSpan } from "./grounding";
import { computeRiskScore, effectiveVerdict } from "./risk";

/**
 * The full analysis pipeline for one contract:
 *   extract clauses + obligations (grounded)  ->  assess vs playbook  ->
 *   derive missing-required findings  ->  score risk.
 *
 * Idempotent: re-running wipes prior findings first, so a failed/partial run
 * can be safely retried.
 */
export async function runAnalysis(contractId: string): Promise<void> {
  const contract = await db.query.contracts.findFirst({
    where: eq(contracts.id, contractId),
  });
  if (!contract) throw new Error(`Contract ${contractId} not found`);

  try {
    await db
      .update(contracts)
      .set({ status: "extracting", error: null, updatedAt: new Date() })
      .where(eq(contracts.id, contractId));

    // Clean slate for re-runs.
    await db.delete(assessments).where(eq(assessments.contractId, contractId));
    await db.delete(clauses).where(eq(clauses.contractId, contractId));
    await db.delete(obligations).where(eq(obligations.contractId, contractId));

    const source = contract.rawText;

    /* ----------------------------- Extraction ---------------------------- */
    const extracted = await chatJson(
      extractionMessages(source),
      extractionSchema,
    );

    // Insert clauses, grounding each quote back to the source text.
    const insertedClauses: {
      id: string;
      clauseType: (typeof clauses.$inferSelect)["clauseType"];
      extractedText: string;
    }[] = [];

    for (const c of extracted.clauses) {
      const span = locateSpan(source, c.quote);
      const [row] = await db
        .insert(clauses)
        .values({
          contractId,
          clauseType: c.clauseType,
          heading: c.heading ?? null,
          extractedText: span.text,
          spanStart: span.start,
          spanEnd: span.end,
          grounded: span.grounded,
        })
        .returning({ id: clauses.id });
      insertedClauses.push({
        id: row.id,
        clauseType: c.clauseType,
        extractedText: span.text,
      });
    }

    // Insert obligations.
    for (const o of extracted.obligations) {
      const span = o.quote ? locateSpan(source, o.quote) : null;
      await db.insert(obligations).values({
        contractId,
        description: o.description,
        obligationType: o.obligationType,
        responsibleParty: o.responsibleParty ?? null,
        dueDate: o.dueDate ?? null,
        trigger: o.trigger ?? null,
        extractedText: span?.text ?? o.quote ?? null,
        spanStart: span?.start ?? null,
        spanEnd: span?.end ?? null,
        grounded: span?.grounded ?? false,
      });
    }

    await db
      .update(contracts)
      .set({ status: "extracted", updatedAt: new Date() })
      .where(eq(contracts.id, contractId));

    /* ----------------------------- Assessment ---------------------------- */
    const rules = await db.select().from(playbookRules);
    const ruleByType = new Map<string, PlaybookRule>();
    for (const r of rules) if (!ruleByType.has(r.clauseType)) ruleByType.set(r.clauseType, r);

    if (insertedClauses.length > 0) {
      const result = await chatJson(
        assessmentMessages(
          insertedClauses.map((c) => ({
            clauseType: c.clauseType,
            extractedText: c.extractedText,
          })),
          rules,
        ),
        assessmentResultSchema,
      );

      const seen = new Set<number>();
      for (const item of result.assessments) {
        if (item.clauseIndex < 0 || item.clauseIndex >= insertedClauses.length)
          continue;
        if (seen.has(item.clauseIndex)) continue;
        seen.add(item.clauseIndex);
        const clause = insertedClauses[item.clauseIndex];
        const rule = ruleByType.get(clause.clauseType);
        await db.insert(assessments).values({
          contractId,
          clauseId: clause.id,
          ruleId: rule?.id ?? null,
          clauseType: clause.clauseType,
          aiVerdict: item.verdict,
          aiRationale: item.rationale,
          aiSuggestion: item.suggestion ?? rule?.guidance ?? null,
          confidence: item.confidence,
        });
      }
    }

    /* ------------------- Missing required clauses (derived) -------------- */
    const presentTypes = new Set(insertedClauses.map((c) => c.clauseType));
    for (const rule of rules) {
      if (!rule.isRequired || presentTypes.has(rule.clauseType)) continue;
      await db.insert(assessments).values({
        contractId,
        clauseId: null,
        ruleId: rule.id,
        clauseType: rule.clauseType,
        aiVerdict: "missing",
        aiRationale: `No ${rule.title} clause was found. The playbook requires this position: ${rule.standardPosition}`,
        aiSuggestion: `Add a ${rule.title} clause. ${rule.guidance}`,
        confidence: 1,
      });
    }

    await recomputeRisk(contractId);

    await db
      .update(contracts)
      .set({ status: "in_review", updatedAt: new Date() })
      .where(eq(contracts.id, contractId));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(contracts)
      .set({ status: "failed", error: message, updatedAt: new Date() })
      .where(eq(contracts.id, contractId));
    throw err;
  }
}

/**
 * Recompute and persist the contract's risk score from its current findings,
 * honoring any human overrides. Called after analysis and after each review
 * action so the headline number always reflects the latest human judgment.
 */
export async function recomputeRisk(contractId: string): Promise<number> {
  const rows = await db
    .select({
      severity: playbookRules.severity,
      aiVerdict: assessments.aiVerdict,
      humanVerdict: assessments.humanVerdict,
    })
    .from(assessments)
    .leftJoin(playbookRules, eq(assessments.ruleId, playbookRules.id))
    .where(eq(assessments.contractId, contractId));

  const score = computeRiskScore(
    rows.map((r) => ({
      severity: r.severity ?? "medium",
      verdict: effectiveVerdict({
        aiVerdict: r.aiVerdict,
        humanVerdict: r.humanVerdict,
      }),
    })),
  );

  await db
    .update(contracts)
    .set({ riskScore: score, updatedAt: new Date() })
    .where(eq(contracts.id, contractId));

  return score;
}
