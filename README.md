# Glade Contract Review

**Live demo → https://glade-contract-review.vercel.app**

AI-assisted first-pass review of inbound vendor contracts. Upload an agreement
and Glade extracts each clause, checks it against your firm's **playbook**,
grounds every finding back to the exact source text, and hands a lawyer a
ranked review queue they can override — plus an obligations calendar and a
printable review memo.

Built as a focused prototype of a real legal-ops workflow.

**Tech stack**

| Layer | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack, Server Actions) |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL — [Neon](https://neon.tech) (prod), local Postgres (dev) |
| ORM / migrations | [Drizzle ORM](https://orm.drizzle.team) + drizzle-kit |
| LLM | [Together AI](https://together.ai) — `MiniMaxAI/MiniMax-M3` |
| Validation | [Zod](https://zod.dev) (structured LLM output + form input) |
| PDF parsing | [unpdf](https://github.com/unjs/unpdf) (serverless-safe text extraction) |
| Icons | [lucide-react](https://lucide.dev) |
| Deployment | [Vercel](https://vercel.com), Neon via Vercel's native marketplace integration |

> Try the three bundled samples on the live site. They're engineered to show
> the full range: a vendor-hostile SaaS agreement (**risk 97**), a moderate
> mutual NDA (**risk 38**), and a balanced services agreement (**risk 4**).
> The spread is the point — the tool discriminates, it doesn't just flag
> everything.

---

## The problem, and the product thesis

In-house legal and legal-ops teams review a constant stream of inbound
contracts — vendor MSAs, NDAs, DPAs — and the job is not "read this document."
It's **"tell me where this contract deviates from the positions we've already
decided we're willing to accept, and what to do about each deviation."**

That reframing drove every product decision here:

- **A generic AI demo summarizes a contract.** That's a party trick — a lawyer
  can read. The value is in the comparison against a *codified standard*.
- **So the playbook is the product.** Each clause is judged against a stored
  firm position with a standard ask, an acceptable fallback, and a walk-away.
  The model applies *the firm's* risk appetite, not its own — which is what
  makes the output consistent and defensible instead of vibes.
- **Lawyers won't trust an AV that can't show its work.** Every finding is
  **grounded**: the model must quote verbatim, and we verify that quote exists
  in the source before we trust it. Ungrounded findings are shown but flagged.
- **The AI is an assistant, not the signer.** Every verdict is overridable, and
  the override is stored and folds into the risk score. The human is always the
  last word.

## What it does

```
Upload / paste  →  Extract clauses (grounded)  →  Assess vs playbook  →
Review queue + human override  →  Obligations calendar  →  Review memo
```

Each clause gets a verdict:

| Verdict | Meaning |
|---|---|
| **Acceptable** | Meets the playbook standard or an acceptable fallback |
| **Needs attention** | Deviates but negotiable — a fallback to accept consciously |
| **Unacceptable** | Hits a walk-away condition or is materially worse than the fallback |
| **Missing** | A *required* clause the contract never included (derived, not guessed) |

The headline **risk score (0–100)** is a transparent rollup: each finding
contributes `severity weight × verdict penalty`, normalized against the worst
case. Override a verdict and the score recomputes immediately.

## Key design decisions & tradeoffs

**The playbook is a first-class table, not a prompt.** Clause types are a
Postgres enum, so clauses can be *joined* to playbook rules and — critically —
we can detect **missing required clauses** deterministically (required rule
types minus the types actually found). Missing-clause findings are computed in
code with 100% confidence, never left to the model to "notice."

**Grounded citations as an anti-hallucination seam.** The extraction prompt
demands verbatim quotes. `locateSpan()` then verifies each quote against the
source — exact match first, then a whitespace-tolerant regex match (models
normalize newlines when quoting). Only verified spans get character offsets and
are highlighted in the document viewer. A finding whose quote can't be located
is surfaced with an **"unverified quote"** badge rather than silently trusted.
This is the difference between a demo and something a lawyer would rely on.

**Structured output without a schema guarantee.** Together's OpenAI-compatible
API offers `response_format: json_object` but no hard JSON-schema mode, so
reliability is engineered in three layers: (1) `response_format: json_object`
+ an explicit schema in the prompt; (2) a brace-matching JSON extractor that
survives markdown fences and preamble; (3) Zod validation with a one-shot
**repair retry** that feeds the validation error back to the model. And when
the model returns a stray enum value, we **coerce it to a safe default rather
than discard the whole extraction** — a lesson from a live run where one bad
`clauseType` out of twelve would otherwise have nuked eleven good clauses.

**Human-in-the-loop is modeled, not bolted on.** `assessments` stores the AI
verdict and the human verdict as separate columns. The effective verdict is
`human ?? ai`, overrides carry a note and reviewer, and the risk score always
reflects the latest human judgment. This also lays the groundwork for the
obvious next step: using overrides as training/eval signal.

**An explicit state machine.** `uploaded → extracting → extracted → in_review →
completed` (plus `failed`) makes the async pipeline observable in the UI and
recoverable — re-running analysis is idempotent (it wipes prior findings
first), so a failed or partial run is always safe to retry.

**Two Postgres connection paths.** Runtime uses the Neon **pooled** endpoint
with `prepare: false` (correct for serverless + PgBouncer transaction mode);
schema migrations run against the **direct** endpoint (pooler can't introspect
/ run DDL cleanly). Same reason real teams keep a separate migration URL.

**Serverless-aware pipeline.** The LLM work runs in a Route Handler with
`maxDuration = 120` and the Node runtime; the client shows staged progress
while it runs. Two sequential model calls land in ~25–55s on the samples.

## Architecture

```
Next.js 16 App Router (RSC + Server Actions)
├── /                         dashboard (contract portfolio)
├── /contracts/new            upload / paste / one-click samples
├── /contracts/[id]           review workspace (findings · document · obligations · memo)
├── /playbook                 the codified firm positions
└── /api/contracts/[id]/analyze   the LLM pipeline (maxDuration 120, node runtime)

src/lib
├── prompts.ts      extraction + assessment prompt builders
├── together.ts     Together client + JSON extraction + Zod repair loop
├── schemas.ts      Zod schemas w/ resilient enum coercion
├── grounding.ts    locateSpan() — the source-verification check
├── analysis.ts     runAnalysis() pipeline orchestration + risk recompute
└── risk.ts         transparent scoring model

src/db  Drizzle schema · playbook (seed) · sample contracts
```

**Data model** (`src/db/schema.ts`): `contracts` → `clauses`,
`assessments`, `obligations`; `playbook_rules` referenced by both `clauses`
(via type) and `assessments`. Reads use Drizzle's relational query API; the
risk rollup is a single join of assessments to rules.

## Edge cases handled

- Stray / mislabeled enum values from the model → coerced, not fatal
- Model quote not found in source → finding kept but flagged unverified
- Overlapping highlight spans → de-overlapped before rendering
- Missing *required* clause → its own derived finding
- Malformed JSON (fences, preamble, trailing prose) → extracted + repaired
- Analysis failure → `failed` state with the error, one-click retry
- Empty / too-short upload → rejected with guidance
- PDF upload → server-side text extraction via `unpdf` (serverless-safe)

## How it would evolve toward production

- **Multi-tenancy & auth** — org-scoped playbooks, roles, audit trail
- **Versioned playbooks** — pin each review to the playbook version used
- **Background jobs** — move the pipeline to a queue (Inngest/QStash) so large
  contracts aren't bound by a request; stream per-clause results
- **Evals** — turn stored human overrides into a regression set; measure
  extraction recall and verdict agreement per playbook version
- **Redline export** — generate a `.docx` with tracked changes from the
  suggested language, not just a memo
- **Retrieval** — for long agreements, chunk + embed and assess per section
- **Clause library** — cluster recurring third-party language to speed review

## Local development

**Prerequisites:** Node 20.9+, [pnpm](https://pnpm.io), a running PostgreSQL
instance, and a [Together AI](https://together.ai) API key.

```bash
pnpm install
cp .env.example .env.local      # set DATABASE_URL, TOGETHER_API_KEY, TOGETHER_MODEL
pnpm db:push                    # create tables from src/db/schema.ts
pnpm db:seed                    # load the playbook (src/db/playbook.ts)
pnpm dev                        # http://localhost:3000
```

Other useful commands:

```bash
pnpm build && pnpm start        # production build + run, locally
pnpm lint                       # ESLint
pnpm exec tsc --noEmit          # typecheck
pnpm db:studio                  # browse the database (Drizzle Studio)
```

The default model is `MiniMaxAI/MiniMax-M3`; any Together AI chat model that
supports `response_format: json_object` will work (see `TOGETHER_MODEL` in
`.env.example`).

## Notes

This is a portfolio prototype, not a production legal product, and nothing it
produces is legal advice. There's no auth — the demo is intentionally open so
it can be evaluated by clicking a link.
