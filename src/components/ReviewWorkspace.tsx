"use client";

import { useMemo, useState, useTransition } from "react";
import clsx from "clsx";
import {
  FileText,
  Scale,
  CalendarClock,
  ClipboardList,
  Quote,
  Pencil,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Printer,
  Link2,
  ShieldAlert,
} from "lucide-react";
import type { Verdict } from "@/db/schema";
import { VerdictPill, SeverityTag, RiskMeter, StatusPill } from "@/components/badges";
import { DocumentViewer, type Highlight } from "@/components/DocumentViewer";
import {
  VERDICT_LABEL,
  VERDICT_RANK,
  SEVERITY_RANK,
  OBLIGATION_LABEL,
} from "@/lib/labels";
import { effectiveVerdict, riskBand } from "@/lib/risk";
import {
  overrideAssessment,
  clearOverride,
  finalizeReview,
  reopenReview,
  deleteContract,
} from "@/app/actions";

export type FindingDTO = {
  id: string;
  clauseType: string;
  clauseTypeLabel: string;
  aiVerdict: Verdict;
  aiRationale: string;
  aiSuggestion: string | null;
  confidence: number;
  humanVerdict: Verdict | null;
  humanNote: string | null;
  ruleTitle: string;
  severity: string;
  standardPosition: string | null;
  clause: {
    heading: string | null;
    extractedText: string;
    spanStart: number | null;
    spanEnd: number | null;
    grounded: boolean;
  } | null;
};

export type ObligationDTO = {
  id: string;
  description: string;
  obligationType: string;
  responsibleParty: string | null;
  dueDate: string | null;
  trigger: string | null;
  extractedText: string | null;
  grounded: boolean;
};

type Contract = {
  id: string;
  title: string;
  counterparty: string | null;
  contractType: string | null;
  status: string;
  rawText: string;
  wordCount: number;
  riskScore: number | null;
};

type Tab = "findings" | "document" | "obligations" | "memo";

export function ReviewWorkspace({
  contract,
  findings,
  obligations,
}: {
  contract: Contract;
  findings: FindingDTO[];
  obligations: ObligationDTO[];
}) {
  const [tab, setTab] = useState<Tab>("findings");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sorted = useMemo(
    () =>
      [...findings].sort(
        (a, b) =>
          VERDICT_RANK[effectiveVerdict(a)] - VERDICT_RANK[effectiveVerdict(b)] ||
          (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9),
      ),
    [findings],
  );

  const counts = useMemo(() => {
    const c: Record<Verdict, number> = {
      unacceptable: 0,
      missing: 0,
      attention: 0,
      acceptable: 0,
    };
    for (const f of findings) c[effectiveVerdict(f)]++;
    return c;
  }, [findings]);

  const openCount = counts.unacceptable + counts.missing + counts.attention;

  const highlights: Highlight[] = useMemo(
    () =>
      findings
        .filter(
          (f) => f.clause?.grounded && f.clause.spanStart != null && f.clause.spanEnd != null,
        )
        .map((f) => ({
          id: f.id,
          start: f.clause!.spanStart!,
          end: f.clause!.spanEnd!,
          verdict: effectiveVerdict(f),
        })),
    [findings],
  );

  function viewInDocument(id: string) {
    setActiveId(id);
    setTab("document");
  }

  const isDone = contract.status === "completed";

  return (
    <div>
      {/* Header */}
      <div className="rounded-xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="truncate text-xl font-semibold tracking-tight text-ink">
                {contract.title}
              </h1>
              <StatusPill status={contract.status} />
            </div>
            <div className="mt-1 text-sm text-muted">
              {contract.counterparty ?? "Unknown counterparty"}
              {contract.contractType ? ` · ${contract.contractType}` : ""} ·{" "}
              {contract.wordCount.toLocaleString()} words
            </div>
            {/* Verdict summary chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              <CountChip verdict="unacceptable" n={counts.unacceptable} />
              <CountChip verdict="missing" n={counts.missing} />
              <CountChip verdict="attention" n={counts.attention} />
              <CountChip verdict="acceptable" n={counts.acceptable} />
            </div>
          </div>
          <RiskMeter score={contract.riskScore} />
        </div>

        {/* Actions */}
        <div className="no-print mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {isDone ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ok">
                <CheckCircle2 size={16} /> Review finalized
              </span>
              <button
                onClick={() => startTransition(() => reopenReview(contract.id))}
                disabled={pending}
                className="ml-1 inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-ink disabled:opacity-50"
              >
                <RotateCcw size={14} /> Reopen
              </button>
            </>
          ) : (
            <button
              onClick={() => startTransition(() => finalizeReview(contract.id))}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <CheckCircle2 size={15} /> Finalize review
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setTab("memo")}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-ink"
            >
              <ClipboardList size={14} /> Memo
            </button>
            <button
              onClick={() => {
                if (confirm("Delete this contract and its analysis?"))
                  startTransition(() => deleteContract(contract.id));
              }}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:border-bad/40 hover:text-bad disabled:opacity-50"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="no-print mt-6 flex gap-1 border-b border-line">
        <TabButton active={tab === "findings"} onClick={() => setTab("findings")} icon={<Scale size={15} />} label="Findings" badge={openCount || undefined} />
        <TabButton active={tab === "document"} onClick={() => setTab("document")} icon={<FileText size={15} />} label="Document" />
        <TabButton active={tab === "obligations"} onClick={() => setTab("obligations")} icon={<CalendarClock size={15} />} label="Obligations" badge={obligations.length || undefined} />
        <TabButton active={tab === "memo"} onClick={() => setTab("memo")} icon={<ClipboardList size={15} />} label="Memo" />
      </div>

      <div className="mt-6">
        {tab === "findings" && (
          <div className="space-y-3">
            {sorted.map((f) => (
              <FindingCard
                key={f.id}
                contractId={contract.id}
                finding={f}
                onView={() => viewInDocument(f.id)}
              />
            ))}
          </div>
        )}

        {tab === "document" && (
          <DocumentViewer
            rawText={contract.rawText}
            highlights={highlights}
            activeId={activeId}
            onSelect={(id) => setActiveId(id)}
          />
        )}

        {tab === "obligations" && <ObligationsPanel obligations={obligations} />}

        {tab === "memo" && (
          <Memo contract={contract} findings={sorted} obligations={obligations} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Sub-parts -------------------------------- */

function CountChip({ verdict, n }: { verdict: Verdict; n: number }) {
  const dim = n === 0;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        dim ? "bg-canvas text-faint" : "",
      )}
    >
      {!dim ? (
        <VerdictPill verdict={verdict} />
      ) : (
        <span className="text-faint">
          {n} {VERDICT_LABEL[verdict]}
        </span>
      )}
      {!dim && <span className="font-semibold text-ink">{n}</span>}
    </span>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "-mb-px flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-medium transition",
        active
          ? "border-brand-600 text-ink"
          : "border-transparent text-muted hover:text-ink",
      )}
    >
      {icon}
      {label}
      {badge != null && (
        <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[11px] text-muted">
          {badge}
        </span>
      )}
    </button>
  );
}

const OVERRIDE_OPTIONS: Verdict[] = ["acceptable", "attention", "unacceptable"];

function FindingCard({
  contractId,
  finding,
  onView,
}: {
  contractId: string;
  finding: FindingDTO;
  onView: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(finding.humanNote ?? "");
  const [pending, startTransition] = useTransition();
  const eff = effectiveVerdict(finding);
  const overridden = finding.humanVerdict != null;

  function save(verdict: Verdict) {
    startTransition(async () => {
      await overrideAssessment(finding.id, contractId, verdict, note);
      setEditing(false);
    });
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <SeverityTag severity={finding.severity} />
        <span className="font-medium text-ink">{finding.ruleTitle}</span>
        <span className="ml-auto flex items-center gap-2.5">
          <span className="text-xs text-faint">
            AI confidence {Math.round(finding.confidence * 100)}%
          </span>
          <VerdictPill verdict={eff} overridden={overridden} />
        </span>
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-ink">
        {finding.aiRationale}
      </p>

      {finding.aiSuggestion && eff !== "acceptable" && (
        <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50/60 p-3">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
            Suggested redline
          </div>
          <p className="text-sm leading-relaxed text-ink">
            {finding.aiSuggestion}
          </p>
        </div>
      )}

      {/* Source grounding */}
      {finding.clause ? (
        <div className="mt-3">
          <div className="mb-1 flex items-center gap-2 text-xs">
            <Quote size={12} className="text-faint" />
            <span className="font-medium text-muted">Source</span>
            {finding.clause.grounded ? (
              <span className="inline-flex items-center gap-1 rounded bg-ok-bg px-1.5 py-0.5 text-[10px] font-medium text-ok">
                <Link2 size={10} /> grounded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-warn-bg px-1.5 py-0.5 text-[10px] font-medium text-warn">
                <ShieldAlert size={10} /> unverified quote
              </span>
            )}
            {finding.clause.grounded && (
              <button
                onClick={onView}
                className="ml-auto text-xs text-brand-600 hover:underline"
              >
                View in document →
              </button>
            )}
          </div>
          <blockquote className="border-l-2 border-line pl-3 text-[13px] leading-relaxed text-muted">
            “{truncate(finding.clause.extractedText, 320)}”
          </blockquote>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-line px-3 py-2 text-[13px] text-muted">
          No matching clause found in the contract.
          {finding.standardPosition && (
            <>
              {" "}
              Playbook requires:{" "}
              <span className="text-ink">{finding.standardPosition}</span>
            </>
          )}
        </div>
      )}

      {/* Reviewer decision */}
      <div className="mt-4 border-t border-line pt-3">
        {!editing ? (
          <div className="flex items-center gap-3 text-sm">
            {overridden ? (
              <span className="text-muted">
                Reviewer set to{" "}
                <span className="font-medium text-ink">
                  {VERDICT_LABEL[finding.humanVerdict!]}
                </span>
                {finding.humanNote ? ` — “${finding.humanNote}”` : ""}
              </span>
            ) : (
              <span className="text-faint">Accepting the AI assessment</span>
            )}
            <span className="ml-auto flex items-center gap-2">
              {overridden && (
                <button
                  onClick={() =>
                    startTransition(() => clearOverride(finding.id, contractId))
                  }
                  disabled={pending}
                  className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink disabled:opacity-50"
                >
                  <RotateCcw size={12} /> Revert to AI
                </button>
              )}
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:text-ink"
              >
                <Pencil size={12} /> Change verdict
              </button>
            </span>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted">
                Reviewer verdict:
              </span>
              {OVERRIDE_OPTIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => save(v)}
                  disabled={pending}
                  className="disabled:opacity-50"
                >
                  <VerdictPill
                    verdict={v}
                    className="ring-1 ring-line hover:ring-brand-400"
                  />
                </button>
              ))}
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for the record (optional)…"
              className="w-full rounded-md border border-line bg-canvas px-3 py-1.5 text-sm outline-none focus:border-brand-400"
            />
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-faint hover:text-ink"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ObligationsPanel({ obligations }: { obligations: ObligationDTO[] }) {
  if (obligations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center text-sm text-muted">
        No post-signing obligations or key dates were detected.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-faint">
            <th className="px-5 py-3 font-medium">Type</th>
            <th className="px-5 py-3 font-medium">Obligation</th>
            <th className="px-5 py-3 font-medium">Owner</th>
            <th className="px-5 py-3 font-medium">Timing</th>
          </tr>
        </thead>
        <tbody>
          {obligations.map((o) => (
            <tr key={o.id} className="border-b border-line last:border-0 align-top">
              <td className="px-5 py-3">
                <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-medium text-muted">
                  {OBLIGATION_LABEL[o.obligationType] ?? o.obligationType}
                </span>
              </td>
              <td className="px-5 py-3 text-ink">{o.description}</td>
              <td className="px-5 py-3 capitalize text-muted">
                {o.responsibleParty ?? "—"}
              </td>
              <td className="px-5 py-3 text-muted">
                {o.dueDate ? (
                  <span className="font-medium text-ink">{o.dueDate}</span>
                ) : o.trigger ? (
                  o.trigger
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Memo({
  contract,
  findings,
  obligations,
}: {
  contract: Contract;
  findings: FindingDTO[];
  obligations: ObligationDTO[];
}) {
  const blockers = findings.filter(
    (f) => effectiveVerdict(f) === "unacceptable" || effectiveVerdict(f) === "missing",
  );
  const attention = findings.filter((f) => effectiveVerdict(f) === "attention");
  const band = riskBand(contract.riskScore ?? 0);
  const bandText =
    band === "high"
      ? "This agreement carries significant risk and should not be signed as drafted."
      : band === "moderate"
        ? "This agreement is largely workable but has items to negotiate before signing."
        : "This agreement is broadly acceptable against our playbook.";

  return (
    <div className="print-container rounded-xl border border-line bg-surface p-8">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">
            Contract Review Memo
          </h2>
          <p className="text-sm text-muted">
            {contract.title}
            {contract.counterparty ? ` — ${contract.counterparty}` : ""}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="no-print inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-ink"
        >
          <Printer size={14} /> Print / PDF
        </button>
      </div>

      <section className="mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-faint">
          Summary
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink">
          {bandText} Risk score{" "}
          <span className="font-semibold">{contract.riskScore ?? "—"}/100</span>.{" "}
          {blockers.length} item{blockers.length === 1 ? "" : "s"} must be
          resolved and {attention.length} item
          {attention.length === 1 ? "" : "s"} warrant attention.
        </p>
      </section>

      {blockers.length > 0 && (
        <MemoSection title="Must resolve before signing" findings={blockers} />
      )}
      {attention.length > 0 && (
        <MemoSection title="Negotiate / confirm" findings={attention} />
      )}

      {obligations.length > 0 && (
        <section className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-faint">
            Key dates &amp; obligations
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-ink">
            {obligations.map((o) => (
              <li key={o.id} className="flex gap-2">
                <span className="text-faint">•</span>
                <span>
                  {o.description}
                  {o.dueDate
                    ? ` (${o.dueDate})`
                    : o.trigger
                      ? ` (${o.trigger})`
                      : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 border-t border-line pt-3 text-xs text-faint">
        Generated by Glade Contract Review. AI-assisted; reflects reviewer
        overrides where applied. Not legal advice.
      </p>
    </div>
  );
}

function MemoSection({
  title,
  findings,
}: {
  title: string;
  findings: FindingDTO[];
}) {
  return (
    <section className="mt-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-faint">
        {title}
      </h3>
      <ol className="mt-2 space-y-3">
        {findings.map((f) => (
          <li key={f.id} className="text-sm">
            <div className="flex items-center gap-2">
              <VerdictPill verdict={effectiveVerdict(f)} />
              <span className="font-medium text-ink">{f.ruleTitle}</span>
            </div>
            <p className="mt-1 leading-relaxed text-ink">{f.aiRationale}</p>
            {f.aiSuggestion && (
              <p className="mt-1 leading-relaxed text-muted">
                <span className="font-medium text-brand-700">Redline:</span>{" "}
                {f.aiSuggestion}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}
