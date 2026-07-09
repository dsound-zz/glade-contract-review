import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runAnalysis } from "@/lib/analysis";

// The LLM pipeline makes two sequential model calls; give it room on Vercel.
export const maxDuration = 120;
export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await runAnalysis(id);
    revalidatePath(`/contracts/${id}`);
    revalidatePath("/");
    return NextResponse.json({ ok: true, status: "in_review" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
