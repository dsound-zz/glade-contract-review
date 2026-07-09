"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, RotateCw, Check } from "lucide-react";

const STEPS = [
  "Extracting clauses",
  "Grounding citations to the source",
  "Checking each clause against the playbook",
  "Scoring risk",
];

export function AnalysisRunner({
  contractId,
  title,
  status,
  error,
  wordCount,
}: {
  contractId: string;
  title: string;
  status: string;
  error: string | null;
  wordCount: number;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [failed, setFailed] = useState(status === "failed");
  const [errMsg, setErrMsg] = useState<string | null>(error);
  const [step, setStep] = useState(0);
  const started = useRef(false);

  async function run() {
    setRunning(true);
    setFailed(false);
    setErrMsg(null);
    setStep(0);

    // Advance the visible steps while the request is in flight (cosmetic).
    const timer = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 9000);

    try {
      const res = await fetch(`/api/contracts/${contractId}/analyze`, {
        method: "POST",
      });
      const data = await res.json();
      clearInterval(timer);
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Analysis failed");
      setStep(STEPS.length);
      router.refresh();
    } catch (e) {
      clearInterval(timer);
      setRunning(false);
      setFailed(true);
      setErrMsg(e instanceof Error ? e.message : "Analysis failed");
    }
  }

  // Auto-start once for a freshly uploaded contract. Deferred to a microtask
  // so run()'s state updates happen outside the effect's synchronous phase.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (status === "uploaded") queueMicrotask(() => run());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) {
    return (
      <div className="rounded-xl border border-line bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-bad-bg text-bad">
          <AlertTriangle size={22} />
        </div>
        <h2 className="text-base font-semibold text-ink">Analysis failed</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          {errMsg ?? "Something went wrong while analyzing this contract."}
        </p>
        <button
          onClick={run}
          className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <RotateCw size={15} /> Retry analysis
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-8">
      <div className="flex items-center gap-2 text-sm font-medium text-ink">
        <Loader2 size={18} className="animate-spin text-brand-600" />
        Analyzing <span className="text-muted">· {title}</span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Reviewing {wordCount.toLocaleString()} words against your playbook —
        two model passes, usually 30–90 seconds.
      </p>
      <ol className="mt-6 space-y-3">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step && running;
          return (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span
                className={
                  "flex h-6 w-6 items-center justify-center rounded-full border " +
                  (done
                    ? "border-brand-600 bg-brand-600 text-white"
                    : active
                      ? "border-brand-400 text-brand-600"
                      : "border-line text-faint")
                }
              >
                {done ? (
                  <Check size={13} />
                ) : active ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <span className="text-xs">{i + 1}</span>
                )}
              </span>
              <span className={done || active ? "text-ink" : "text-faint"}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
