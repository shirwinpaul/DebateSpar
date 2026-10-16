"use client";
import { useEffect, useRef } from "react";

/** Accessible modal using the native <dialog> element (focus trap + Esc built in). */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="modal-title"
      className="m-auto w-[min(92vw,32rem)] rounded-2xl border border-line bg-elev p-0 text-fg backdrop:bg-black/60"
    >
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="modal-title" className="font-display text-3xl tracking-wide">{title}</h2>
          <button type="button" onClick={onClose} className="btn btn-ghost px-3" aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
