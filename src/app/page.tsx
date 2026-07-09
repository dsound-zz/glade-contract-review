import Link from "next/link";
import { desc } from "drizzle-orm";
import { FileText, Plus, ArrowRight, ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { contracts, assessments } from "@/db/schema";
import { StatusPill } from "@/components/badges";
import { effectiveVerdict } from "@/lib/risk";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export default async function DashboardPage() {
  const rows = await db.select().from(contracts).orderBy(desc(contracts.createdAt));
  const findings = await db
    .select({
      contractId: assessments.contractId,
      aiVerdict: assessments.aiVerdict,
      humanVerdict: assessments.humanVerdict,
    })
    .from(assessments);

  // Aggregate open (non-acceptable) findings per contract.
  const openByContract = new Map<string, number>();
  for (const f of findings) {
    if (effectiveVerdict(f) !== "acceptable") {
      openByContract.set(f.contractId, (openByContract.get(f.contractId) ?? 0) + 1);
    }
  }

  return (
    <div>
      <div className="mb-7 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Contracts
          </h1>
          <p className="mt-1 text-sm text-muted">
            Inbound agreements reviewed against your firm&apos;s playbook.
          </p>
        </div>
        <Link
          href="/contracts/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus size={16} /> New review
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-5 py-3 font-medium">Contract</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Open items</th>
                <th className="px-5 py-3 font-medium">Risk</th>
                <th className="px-5 py-3 font-medium">Added</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const open = openByContract.get(c.id) ?? 0;
                return (
                  <tr
                    key={c.id}
                    className="group border-b border-line last:border-0 hover:bg-canvas/60"
                  >
                    <td className="px-5 py-4">
                      <Link href={`/contracts/${c.id}`} className="block">
                        <div className="flex items-center gap-2 font-medium text-ink">
                          <FileText size={15} className="text-faint" />
                          {c.title}
                        </div>
                        <div className="mt-0.5 pl-[23px] text-xs text-muted">
                          {c.counterparty ?? "Unknown counterparty"}
                          {c.contractType ? ` · ${c.contractType}` : ""}
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={c.status} />
                    </td>
                    <td className="px-5 py-4">
                      {c.status === "in_review" || c.status === "completed" ? (
                        <span className={open > 0 ? "font-medium text-bad" : "text-ok"}>
                          {open > 0 ? `${open} to resolve` : "All clear"}
                        </span>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {c.riskScore !== null ? (
                        <span className="font-semibold text-ink">
                          {c.riskScore}
                          <span className="text-xs font-normal text-faint">/100</span>
                        </span>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted">{formatDate(c.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/contracts/${c.id}`}
                        className="inline-flex items-center gap-1 text-brand-600 opacity-0 transition group-hover:opacity-100"
                      >
                        Open <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <ShieldCheck size={22} />
      </div>
      <h2 className="text-base font-semibold text-ink">No contracts yet</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
        Upload an inbound agreement and Glade will extract its clauses, check each
        against your playbook, and flag what needs a lawyer&apos;s attention.
      </p>
      <Link
        href="/contracts/new"
        className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        <Plus size={16} /> Start a review
      </Link>
    </div>
  );
}
