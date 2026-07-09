import { db } from "@/db";
import { playbookRules } from "@/db/schema";
import { SeverityTag } from "@/components/badges";
import { clauseTypeLabel, SEVERITY_RANK } from "@/lib/labels";
import { BookMarked, Check, TriangleAlert, Ban } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlaybookPage() {
  const rules = await db.select().from(playbookRules);
  rules.sort(
    (a, b) =>
      (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9) ||
      a.title.localeCompare(b.title),
  );

  return (
    <div>
      <div className="mb-6 flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <BookMarked size={18} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Review playbook
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            The firm&apos;s codified positions for inbound vendor agreements.
            Every AI assessment is made strictly against these rules — the model
            applies the firm&apos;s risk appetite, not its own.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rules.map((r) => (
          <div key={r.id} className="rounded-xl border border-line bg-surface p-5">
            <div className="flex items-center gap-2.5">
              <span className="font-medium text-ink">{r.title}</span>
              {r.isRequired && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-700">
                  Required
                </span>
              )}
              <span className="ml-auto">
                <SeverityTag severity={r.severity} />
              </span>
            </div>
            <div className="mt-0.5 text-xs text-faint">
              {clauseTypeLabel(r.clauseType)}
            </div>

            <dl className="mt-3 space-y-2 text-[13px] leading-relaxed">
              <Row
                icon={<Check size={13} className="text-ok" />}
                label="Standard"
                text={r.standardPosition}
              />
              <Row
                icon={<TriangleAlert size={13} className="text-warn" />}
                label="Fallback"
                text={r.fallbackPosition}
              />
              <Row
                icon={<Ban size={13} className="text-bad" />}
                label="Walk-away"
                text={r.walkAway}
              />
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
}) {
  return (
    <div className="flex gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <span className="font-medium text-muted">{label}: </span>
        <span className="text-ink">{text}</span>
      </div>
    </div>
  );
}
