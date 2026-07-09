/**
 * Span grounding — the anti-hallucination check.
 *
 * The model returns a `quote` it claims to have copied from the contract. We
 * verify that claim by locating the quote in the source text. A finding is only
 * trusted ("grounded") if we can point to the exact characters it came from.
 * Ungrounded findings are still surfaced, but flagged, so a reviewer never
 * mistakes a paraphrase or hallucination for a real citation.
 */

export type LocatedSpan = {
  start: number | null;
  end: number | null;
  /** The real text from the source (not the model's possibly-reworded quote). */
  text: string;
  grounded: boolean;
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function locateSpan(source: string, quote: string): LocatedSpan {
  const cleaned = quote.trim();
  if (!cleaned) return { start: null, end: null, text: quote, grounded: false };

  // 1) Exact match — the happy path.
  const exact = source.indexOf(cleaned);
  if (exact !== -1) {
    return {
      start: exact,
      end: exact + cleaned.length,
      text: source.slice(exact, exact + cleaned.length),
      grounded: true,
    };
  }

  // 2) Whitespace-tolerant match. Models normalize newlines/spacing when
  //    quoting; collapse runs of whitespace to `\s+` so those diffs don't
  //    defeat grounding. Guard the pattern length to keep the regex cheap.
  const capped = cleaned.slice(0, 600);
  const pattern = escapeRegExp(capped).replace(/\s+/g, "\\s+");
  try {
    const re = new RegExp(pattern);
    const m = re.exec(source);
    if (m && m.index >= 0) {
      return {
        start: m.index,
        end: m.index + m[0].length,
        text: source.slice(m.index, m.index + m[0].length),
        grounded: true,
      };
    }
  } catch {
    // Pattern failed to compile; fall through to ungrounded.
  }

  // 3) Not found — surface the model's text but mark it untrusted.
  return { start: null, end: null, text: quote, grounded: false };
}
