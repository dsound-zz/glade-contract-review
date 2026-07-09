import { z } from "zod";

const TOGETHER_URL = "https://api.together.xyz/v1/chat/completions";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function getConfig() {
  const apiKey = process.env.TOGETHER_API_KEY;
  const model = process.env.TOGETHER_MODEL;
  if (!apiKey) throw new Error("TOGETHER_API_KEY is not set");
  if (!model) throw new Error("TOGETHER_MODEL is not set");
  return { apiKey, model };
}

/** Pull the first balanced JSON object out of a model response. Handles the
 *  common failure modes: markdown fences, chain-of-thought preamble, or a
 *  trailing explanation after the JSON. */
export function extractJson(raw: string): string {
  let text = raw.trim();
  // Strip ```json ... ``` fences if present.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  const start = text.indexOf("{");
  if (start === -1) return text;

  // Walk to the matching closing brace, respecting strings/escapes.
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') inString = !inString;
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return text.slice(start);
}

async function rawChat(messages: ChatMessage[], temperature: number) {
  const { apiKey, model } = getConfig();
  const res = await fetch(TOGETHER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Together API error ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Together API returned no content");
  return content;
}

/**
 * Call the model and validate its JSON output against a Zod schema. On a parse
 * or validation failure we retry once, feeding the error back so the model can
 * repair its output — this is the reliability seam for working with a model
 * that has no guaranteed structured-output mode.
 */
export async function chatJson<T>(
  messages: ChatMessage[],
  schema: z.ZodType<T>,
  opts: { temperature?: number } = {},
): Promise<T> {
  const temperature = opts.temperature ?? 0.1;

  const attempt = async (msgs: ChatMessage[]) => {
    const content = await rawChat(msgs, temperature);
    const json = JSON.parse(extractJson(content));
    return schema.parse(json);
  };

  try {
    return await attempt(messages);
  } catch (firstErr) {
    const reason =
      firstErr instanceof Error ? firstErr.message : String(firstErr);
    const repairMessages: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        content:
          "Your previous response could not be parsed into the required JSON " +
          `schema. Error: ${reason}. Respond again with ONLY valid JSON that ` +
          "matches the requested structure exactly. No prose, no markdown.",
      },
    ];
    return await attempt(repairMessages);
  }
}
