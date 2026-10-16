"use client";
import { useState } from "react";
import { Modal } from "./Modal";
import { KEYS, loadString, saveString } from "@/lib/storage";

/** Bring-Your-Own-Key: personal Gemini key stored only in this browser's localStorage. */
export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  // Reload the saved key each time the dialog opens (state adjusted during render).
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setKey(loadString(KEYS.byok));
      setSaved(false);
    }
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    saveString(KEYS.byok, key.trim());
    setSaved(true);
  }

  return (
    <Modal open={open} onClose={onClose} title="⚙️ Settings">
      <form onSubmit={onSave} className="space-y-4">
        <div>
          <label htmlFor="byok" className="block font-semibold">Your own Gemini API key (optional)</label>
          <p className="mt-1 text-sm text-muted">
            If the shared free limit runs out, paste your own free key. It stays only in this browser and is sent with each
            request. It is never stored or logged on the server.
          </p>
          <div className="mt-2 flex gap-2">
            <input
              id="byok"
              type={show ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              value={key}
              onChange={(e) => { setKey(e.target.value); setSaved(false); }}
              placeholder="AIza…"
              className="input"
            />
            <button type="button" className="btn btn-ghost" onClick={() => setShow((s) => !s)} aria-pressed={show}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <details className="rounded-lg bg-elev-2 p-3 text-sm">
          <summary className="cursor-pointer font-semibold">How do I get a free key?</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
            <li>Go to <a className="text-prop underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com</a> and sign in with a Google account.</li>
            <li>Click <b>Create API key</b>.</li>
            <li>Copy the key, paste it above and press Save.</li>
          </ol>
        </details>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className="btn btn-gold">Save</button>
          <button type="button" className="btn btn-ghost" onClick={() => { setKey(""); saveString(KEYS.byok, ""); setSaved(true); }}>
            Remove key
          </button>
          <span role="status" className="text-sm text-muted">{saved ? "✓ Saved" : ""}</span>
        </div>
      </form>
    </Modal>
  );
}
