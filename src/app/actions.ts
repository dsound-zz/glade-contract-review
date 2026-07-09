"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contracts, assessments } from "@/db/schema";
import type { Verdict } from "@/db/schema";
import { recomputeRisk } from "@/lib/analysis";
import { SAMPLE_CONTRACTS } from "@/db/samples";

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function extractPdfText(file: File): Promise<string> {
  const { getDocumentProxy, extractText } = await import("unpdf");
  const buf = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocumentProxy(buf);
  // With mergePages, unpdf returns the whole document as a single string.
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

/** Create a contract from the new-review form (pasted text or an uploaded
 *  PDF/txt), then hand off to the review workspace which triggers analysis. */
export async function createContractFromForm(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const counterparty = (formData.get("counterparty") as string)?.trim();
  const contractType = (formData.get("contractType") as string)?.trim();
  const pasted = (formData.get("pasteText") as string)?.trim();
  const file = formData.get("file") as File | null;

  let rawText = pasted ?? "";
  let sourceFilename: string | null = null;

  if (file && file.size > 0) {
    sourceFilename = file.name;
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      rawText = await extractPdfText(file);
    } else {
      rawText = await file.text();
    }
  }

  rawText = rawText.trim();
  if (rawText.length < 40) {
    // Not enough to analyze — bounce back with a hint.
    redirect("/contracts/new?error=empty");
  }

  const [row] = await db
    .insert(contracts)
    .values({
      title: title || sourceFilename || "Untitled contract",
      counterparty: counterparty || null,
      contractType: contractType || null,
      rawText,
      sourceFilename,
      wordCount: wordCount(rawText),
      status: "uploaded",
    })
    .returning({ id: contracts.id });

  redirect(`/contracts/${row.id}`);
}

/** One-click load of a bundled sample contract for demos. */
export async function createSampleContract(formData: FormData) {
  const key = formData.get("key") as string;
  const sample = SAMPLE_CONTRACTS.find((s) => s.key === key);
  if (!sample) redirect("/contracts/new");

  const [row] = await db
    .insert(contracts)
    .values({
      title: sample.title,
      counterparty: sample.counterparty,
      contractType: sample.contractType,
      rawText: sample.rawText,
      sourceFilename: `${sample.key}.txt`,
      wordCount: wordCount(sample.rawText),
      status: "uploaded",
    })
    .returning({ id: contracts.id });

  redirect(`/contracts/${row.id}`);
}

/** Human-in-the-loop override of an AI verdict. */
export async function overrideAssessment(
  assessmentId: string,
  contractId: string,
  humanVerdict: Verdict,
  humanNote: string,
) {
  await db
    .update(assessments)
    .set({
      humanVerdict,
      humanNote: humanNote?.trim() || null,
      reviewedBy: "Reviewer",
      reviewedAt: new Date(),
    })
    .where(eq(assessments.id, assessmentId));

  await recomputeRisk(contractId);
  revalidatePath(`/contracts/${contractId}`);
}

/** Revert an override back to the AI's assessment. */
export async function clearOverride(assessmentId: string, contractId: string) {
  await db
    .update(assessments)
    .set({
      humanVerdict: null,
      humanNote: null,
      reviewedBy: null,
      reviewedAt: null,
    })
    .where(eq(assessments.id, assessmentId));

  await recomputeRisk(contractId);
  revalidatePath(`/contracts/${contractId}`);
}

export async function finalizeReview(contractId: string) {
  await db
    .update(contracts)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(contracts.id, contractId));
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/");
}

export async function reopenReview(contractId: string) {
  await db
    .update(contracts)
    .set({ status: "in_review", updatedAt: new Date() })
    .where(eq(contracts.id, contractId));
  revalidatePath(`/contracts/${contractId}`);
}

export async function deleteContract(contractId: string) {
  await db.delete(contracts).where(eq(contracts.id, contractId));
  redirect("/");
}
