import Link from "next/link";
import { ArrowLeft, FileUp, Sparkles } from "lucide-react";
import { createContractFromForm, createSampleContract } from "@/app/actions";
import { SAMPLE_CONTRACTS } from "@/db/samples";

export const dynamic = "force-dynamic";

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft size={15} /> Contracts
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        New contract review
      </h1>
      <p className="mt-1 text-sm text-muted">
        Paste the agreement text or upload a PDF. Glade extracts each clause,
        grounds it to the source, and checks it against your playbook.
      </p>

      {error === "empty" && (
        <div className="mt-4 rounded-md border border-bad/30 bg-bad-bg px-4 py-2.5 text-sm text-bad">
          We couldn&apos;t read enough text from that input. Paste the contract
          body or upload a text-based PDF.
        </div>
      )}

      {/* Samples */}
      <div className="mt-7">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
          <Sparkles size={15} className="text-brand-600" />
          Try a sample
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {SAMPLE_CONTRACTS.map((s) => (
            <form action={createSampleContract} key={s.key}>
              <input type="hidden" name="key" value={s.key} />
              <button
                type="submit"
                className="h-full w-full rounded-lg border border-line bg-surface p-4 text-left transition hover:border-brand-200 hover:shadow-sm"
              >
                <div className="text-sm font-medium text-ink">{s.title}</div>
                <div className="mt-1 text-xs text-muted">{s.blurb}</div>
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className="my-8 flex items-center gap-3 text-xs uppercase tracking-wide text-faint">
        <span className="h-px flex-1 bg-line" /> or bring your own{" "}
        <span className="h-px flex-1 bg-line" />
      </div>

      {/* Manual entry */}
      <form
        action={createContractFromForm}
        className="rounded-xl border border-line bg-surface p-6"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-1">
            <span className="text-xs font-medium text-muted">Title</span>
            <input
              name="title"
              placeholder="e.g. Acme MSA"
              className="mt-1 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </label>
          <label className="block sm:col-span-1">
            <span className="text-xs font-medium text-muted">Counterparty</span>
            <input
              name="counterparty"
              placeholder="e.g. Acme, Inc."
              className="mt-1 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </label>
          <label className="block sm:col-span-1">
            <span className="text-xs font-medium text-muted">Type</span>
            <input
              name="contractType"
              placeholder="e.g. SaaS, NDA"
              className="mt-1 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-muted">Contract text</span>
          <textarea
            name="pasteText"
            rows={10}
            placeholder="Paste the full agreement here…"
            className="mt-1 w-full resize-y rounded-md border border-line bg-canvas px-3 py-2 font-mono text-[13px] leading-relaxed outline-none focus:border-brand-400"
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-muted hover:text-ink">
            <FileUp size={15} />
            <span>Upload PDF / .txt</span>
            <input type="file" name="file" accept=".pdf,.txt,.md" className="hidden" />
          </label>
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Analyze contract
          </button>
        </div>
      </form>
    </div>
  );
}
