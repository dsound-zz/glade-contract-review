import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { contracts } from "@/db/schema";
import { AnalysisRunner } from "@/components/AnalysisRunner";
import { ReviewWorkspace, type FindingDTO, type ObligationDTO } from "@/components/ReviewWorkspace";
import { clauseTypeLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function ContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const contract = await db.query.contracts.findFirst({
    where: eq(contracts.id, id),
    with: {
      obligations: true,
      assessments: { with: { clause: true, rule: true } },
    },
  });

  if (!contract) notFound();

  // Pre-analysis / in-flight / failed states get the runner, not the workspace.
  if (
    contract.status === "uploaded" ||
    contract.status === "extracting" ||
    contract.status === "extracted" ||
    contract.status === "failed"
  ) {
    return (
      <div className="mx-auto max-w-2xl">
        <BackLink />
        <AnalysisRunner
          contractId={contract.id}
          title={contract.title}
          status={contract.status}
          error={contract.error}
          wordCount={contract.wordCount}
        />
      </div>
    );
  }

  const findings: FindingDTO[] = contract.assessments.map((a) => ({
    id: a.id,
    clauseType: a.clauseType,
    clauseTypeLabel: clauseTypeLabel(a.clauseType),
    aiVerdict: a.aiVerdict,
    aiRationale: a.aiRationale,
    aiSuggestion: a.aiSuggestion,
    confidence: a.confidence,
    humanVerdict: a.humanVerdict,
    humanNote: a.humanNote,
    ruleTitle: a.rule?.title ?? clauseTypeLabel(a.clauseType),
    severity: a.rule?.severity ?? "medium",
    standardPosition: a.rule?.standardPosition ?? null,
    clause: a.clause
      ? {
          heading: a.clause.heading,
          extractedText: a.clause.extractedText,
          spanStart: a.clause.spanStart,
          spanEnd: a.clause.spanEnd,
          grounded: a.clause.grounded,
        }
      : null,
  }));

  const obligations: ObligationDTO[] = contract.obligations.map((o) => ({
    id: o.id,
    description: o.description,
    obligationType: o.obligationType,
    responsibleParty: o.responsibleParty,
    dueDate: o.dueDate,
    trigger: o.trigger,
    extractedText: o.extractedText,
    grounded: o.grounded,
  }));

  return (
    <div>
      <BackLink />
      <ReviewWorkspace
        contract={{
          id: contract.id,
          title: contract.title,
          counterparty: contract.counterparty,
          contractType: contract.contractType,
          status: contract.status,
          rawText: contract.rawText,
          wordCount: contract.wordCount,
          riskScore: contract.riskScore,
        }}
        findings={findings}
        obligations={obligations}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/"
      className="no-print mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
    >
      <ArrowLeft size={15} /> Contracts
    </Link>
  );
}
