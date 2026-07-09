import clsx from "clsx";
import type { Verdict } from "@/db/schema";
import {
  VERDICT_LABEL,
  VERDICT_CLASSES,
  VERDICT_DOT,
  SEVERITY_LABEL,
  STATUS_LABEL,
} from "@/lib/labels";
import { riskBand } from "@/lib/risk";

export function VerdictPill({
  verdict,
  overridden,
  className,
}: {
  verdict: Verdict;
  overridden?: boolean;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        VERDICT_CLASSES[verdict],
        className,
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", VERDICT_DOT[verdict])} />
      {VERDICT_LABEL[verdict]}
      {overridden && <span className="opacity-60">· edited</span>}
    </span>
  );
}

export function SeverityTag({ severity }: { severity: string }) {
  const tone =
    severity === "critical" || severity === "high"
      ? "text-bad"
      : severity === "medium"
        ? "text-warn"
        : "text-faint";
  return (
    <span className={clsx("text-[11px] font-medium uppercase tracking-wide", tone)}>
      {SEVERITY_LABEL[severity] ?? severity}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "failed"
      ? "bg-bad-bg text-bad"
      : status === "completed"
        ? "bg-ok-bg text-ok"
        : status === "in_review"
          ? "bg-brand-50 text-brand-700"
          : "bg-canvas text-muted";
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone,
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

const RISK_TONE = {
  low: { text: "text-ok", ring: "stroke-ok", label: "Low risk" },
  moderate: { text: "text-warn", ring: "stroke-warn", label: "Moderate risk" },
  high: { text: "text-bad", ring: "stroke-bad", label: "High risk" },
} as const;

/** Circular risk gauge, 0-100. */
export function RiskMeter({
  score,
  size = 72,
}: {
  score: number | null;
  size?: number;
}) {
  const value = score ?? 0;
  const band = riskBand(value);
  const tone = RISK_TONE[band];
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;

  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            className="stroke-line"
            strokeWidth={6}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            className={tone.ring}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={clsx("text-lg font-semibold", tone.text)}>
            {score === null ? "—" : value}
          </span>
        </div>
      </div>
      <div>
        <div className={clsx("text-sm font-semibold", tone.text)}>
          {tone.label}
        </div>
        <div className="text-xs text-faint">risk score / 100</div>
      </div>
    </div>
  );
}
