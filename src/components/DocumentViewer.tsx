"use client";

import { useEffect } from "react";
import clsx from "clsx";
import type { Verdict } from "@/db/schema";

export type Highlight = {
  id: string;
  start: number;
  end: number;
  verdict: Verdict;
};

/**
 * Renders the raw contract with grounded clause spans highlighted by verdict.
 * Only findings whose quote was verified against the source (grounded, with
 * offsets) appear as highlights — we never fabricate a citation location.
 */
export function DocumentViewer({
  rawText,
  highlights,
  activeId,
  onSelect,
}: {
  rawText: string;
  highlights: Highlight[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  useEffect(() => {
    if (!activeId) return;
    document
      .getElementById(`finding-${activeId}`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeId]);

  // Sort and drop overlaps so segmentation is unambiguous.
  const spans = [...highlights]
    .filter((h) => h.start != null && h.end != null && h.end > h.start)
    .sort((a, b) => a.start - b.start);

  const segments: React.ReactNode[] = [];
  let cursor = 0;
  let lastEnd = 0;
  spans.forEach((h, i) => {
    if (h.start < lastEnd) return; // skip overlapping span
    if (h.start > cursor) {
      segments.push(
        <span key={`t-${i}`}>{rawText.slice(cursor, h.start)}</span>,
      );
    }
    segments.push(
      <mark
        key={`m-${h.id}`}
        id={`finding-${h.id}`}
        data-verdict={h.verdict}
        className={clsx("cursor-pointer", activeId === h.id && "is-active")}
        onClick={() => onSelect(h.id)}
      >
        {rawText.slice(h.start, h.end)}
      </mark>,
    );
    cursor = h.end;
    lastEnd = h.end;
  });
  segments.push(<span key="t-end">{rawText.slice(cursor)}</span>);

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="no-print flex flex-wrap items-center gap-4 border-b border-line px-5 py-2.5 text-xs text-muted">
        <span className="font-medium text-ink">Source document</span>
        <Legend />
        <span className="ml-auto text-faint">
          Only grounded clauses are highlighted
        </span>
      </div>
      <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap px-6 py-5 font-mono text-[13px] leading-relaxed text-ink">
        {segments}
      </pre>
    </div>
  );
}

function Legend() {
  const items: { verdict: Verdict; label: string }[] = [
    { verdict: "acceptable", label: "Acceptable" },
    { verdict: "attention", label: "Attention" },
    { verdict: "unacceptable", label: "Unacceptable" },
  ];
  return (
    <span className="flex items-center gap-3">
      {items.map((it) => (
        <span key={it.verdict} className="flex items-center gap-1.5">
          <mark data-verdict={it.verdict} className="px-1.5 text-[11px]">
            &nbsp;
          </mark>
          {it.label}
        </span>
      ))}
    </span>
  );
}
