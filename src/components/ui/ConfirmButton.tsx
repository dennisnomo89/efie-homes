"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Portal } from "./Portal";
import { useDialogFocus } from "./useDialogFocus";

type Props = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  className?: string;
  danger?: boolean;
  children: React.ReactNode;
};

/** A button that asks for confirmation in a small modal before running an action. */
export function ConfirmButton({ title, description, confirmLabel, onConfirm, className, danger = true, children }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocus(open, panelRef, "[data-autofocus]");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy]);

  async function run() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open && (
        <Portal>
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="absolute inset-0 animate-fade-in bg-ink/50" onClick={() => !busy && setOpen(false)} />
          <div ref={panelRef} className="relative w-full max-w-sm animate-slide-up rounded-3xl bg-white p-6 shadow-2xl">
            <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", danger ? "bg-red-50 text-red-600" : "bg-gold-100 text-gold-600")}>
              <TriangleAlert className="h-5 w-5" />
            </span>
            <h2 id="confirm-title" className="mt-4 text-lg font-semibold">
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-stone-600">{description}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="btn btn-outline" data-autofocus>
                Cancel
              </button>
              <button type="button" onClick={run} disabled={busy} className={cn("btn", danger ? "btn-danger" : "btn-primary")}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} {confirmLabel}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </>
  );
}
