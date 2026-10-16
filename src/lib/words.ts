/** Count words by whitespace (works for English, Tamil and Hindi). */
export function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/u).length : 0;
}

/** Truncate text to at most `max` words, adding an ellipsis if anything was cut. */
export function enforceWordCap(text: string, max: number): string {
  const words = text.trim().split(/\s+/u);
  if (words.length <= max) return text.trim();
  return words.slice(0, max).join(" ").replace(/[,;:\s]+$/u, "") + "…";
}

/** First `n` words, for compact summaries. */
export function firstWords(text: string, n: number): string {
  return enforceWordCap(text, n);
}
