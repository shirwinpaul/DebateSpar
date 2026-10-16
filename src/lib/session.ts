import type { DebateSettings } from "@/types/debate";
import { createDebate } from "@/lib/debate";
import { KEYS, remove, save } from "@/lib/storage";

export const DRAFT_KEY = "dd.draft";

/** Start a fresh debate from settings (Rematch / Switch sides). */
export function startDebateFrom(settings: DebateSettings) {
  save(KEYS.settings, settings);
  save(KEYS.current, createDebate(settings));
  remove(DRAFT_KEY);
}
