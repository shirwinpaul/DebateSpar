import type { RoundInput } from "@/lib/schemas";
import { firstWords } from "@/lib/words";

/**
 * Rough token estimate. English averages ~4 chars/token; Tamil/Hindi scripts tokenise
 * far less efficiently, so non-ASCII characters are weighted heavily. Erring high is safe.
 */
export function estimateTokens(text: string): number {
  let ascii = 0;
  let other = 0;
  for (const ch of text) {
    if (ch.charCodeAt(0) < 128) ascii++;
    else other++;
  }
  return Math.ceil(ascii / 4 + other / 1.5);
}

/** Strip our data delimiters from user text so it can't break out of its <user_data> block. */
export function sanitize(text: string): string {
  return text.replace(/<\/?\s*user_data\s*>/gi, "");
}

/** "all" = every round in full (used by the judge when it fits). */
export type CompactLevel = "all" | "full" | "compact";

/**
 * Render the transcript compactly.
 * - "full": full text of the last 2 rounds + a short summary line for each earlier round.
 * - "compact": full text of only the last round (used to fit Groq's tokens-per-minute limit).
 * The summary is built in code (AI's main points + the user's opening words) so it costs no AI call.
 */
export function compactTranscript(rounds: RoundInput[], opener: "user" | "ai", level: CompactLevel = "full"): string {
  if (rounds.length === 0) return "(no speeches yet)";
  const keepFull = level === "all" ? rounds.length : level === "full" ? 2 : 1;
  const cut = Math.max(0, rounds.length - keepFull);
  const lines: string[] = [];

  if (cut > 0) {
    lines.push("Summary of earlier rounds:");
    for (const r of rounds.slice(0, cut)) {
      const parts: string[] = [];
      if (r.userSpeech) parts.push(`User: "${sanitize(firstWords(r.userSpeech, 25))}"`);
      if (r.aiPoints?.length) parts.push(`AI points: ${r.aiPoints.map(sanitize).join("; ")}`);
      lines.push(`R${r.number}: ${parts.join(" | ")}`);
    }
    lines.push("");
  }

  for (const r of rounds.slice(cut)) {
    const user = r.userSpeech ? `[R${r.number} USER]${r.userOverTime ? " (over time)" : ""}: ${sanitize(r.userSpeech)}` : null;
    const ai = r.aiSpeech ? `[R${r.number} AI]: ${sanitize(r.aiSpeech)}` : null;
    const ordered = opener === "user" ? [user, ai] : [ai, user];
    lines.push(...(ordered.filter(Boolean) as string[]));
  }
  return lines.join("\n");
}
