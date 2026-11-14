"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "success" | "error" | "info";
type ToastItem = { id: number; title: string; description?: string; variant: Variant };
type ToastInput = { title: string; description?: string; variant?: Variant };

const ToastContext = createContext<{ toast: (t: ToastInput) => void } | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setItems((all) => all.filter((t) => t.id !== id)), []);

  const toast = useCallback((t: ToastInput) => {
    const id = nextId++;
    setItems((all) => [...all.slice(-3), { id, variant: "success", ...t }]);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:bottom-4 sm:left-auto sm:right-4 sm:items-end"
      >
        {items.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const Icon = item.variant === "error" ? CircleAlert : item.variant === "info" ? Info : CircleCheck;

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-2xl border bg-white p-4 shadow-lift",
        item.variant === "error" && "border-red-200",
        item.variant === "success" && "border-forest-200",
        item.variant === "info" && "border-gold-300",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0",
          item.variant === "error" && "text-red-600",
          item.variant === "success" && "text-forest-600",
          item.variant === "info" && "text-gold-600",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{item.title}</p>
        {item.description && <p className="mt-0.5 text-sm text-stone-600">{item.description}</p>}
      </div>
      <button onClick={onDismiss} className="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
