"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, Loader2, X } from "lucide-react";
import { useToast } from "./ui/Toast";
import { Portal } from "./ui/Portal";
import { useDialogFocus } from "./ui/useDialogFocus";
import { VIEWING_TIME_SLOTS } from "@/lib/constants";
import { viewingRequestSchema, fieldErrors } from "@/lib/validations";
import { cn, formatTime } from "@/lib/utils";

type Props = {
  propertyId: string;
  propertyTitle: string;
  viewer: { role: string; phone: string | null; name: string } | null;
  rented: boolean;
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function ScheduleViewingModal({ propertyId, propertyTitle, viewer, rented }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(open, dialogRef, "input");

  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const maxDate = new Date(today.getTime() + 90 * 86_400_000);

  const [form, setForm] = useState({
    preferredDate: isoDate(tomorrow),
    preferredTime: "10:00",
    phone: viewer?.phone ?? "",
    message: `Hello, I'm interested in "${propertyTitle}" and would like to arrange a viewing. Is it still available?`,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (rented) {
    return (
      <button disabled className="btn btn-primary w-full">
        This home has been rented
      </button>
    );
  }

  if (!viewer) {
    return (
      <Link href={`/login?next=${encodeURIComponent(`/properties/${propertyId}`)}`} className="btn btn-primary w-full">
        <CalendarDays className="h-4 w-4" /> Log in to schedule a viewing
      </Link>
    );
  }

  if (viewer.role !== "TENANT") {
    return (
      <div className="rounded-xl bg-stone-100 p-3 text-center text-sm text-stone-600">
        Viewing requests are sent from tenant accounts.
      </div>
    );
  }

  const update = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { propertyId, ...form };
    const parsed = viewingRequestSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/viewings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      if (data.errors) setErrors(data.errors);
      toast({ title: "Request not sent", description: data.error ?? "Please try again.", variant: "error" });
      return;
    }
    setOpen(false);
    toast({ title: "Viewing request sent!", description: "The landlord will confirm in their dashboard. Track it under My viewings." });
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary w-full">
        <CalendarDays className="h-4 w-4" /> Schedule a viewing
      </button>

      {open && (
        <Portal>
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="viewing-title">
          <div className="absolute inset-0 animate-fade-in bg-ink/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div ref={dialogRef} className="relative flex max-h-[92vh] w-full max-w-lg animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-5 py-4 sm:px-6">
              <div>
                <h2 id="viewing-title" className="font-display text-xl font-semibold">
                  Schedule a viewing
                </h2>
                <p className="mt-0.5 line-clamp-1 text-sm text-stone-500">{propertyTitle}</p>
              </div>
              <button onClick={() => setOpen(false)} className="-mr-2 flex h-10 w-10 items-center justify-center rounded-xl hover:bg-stone-100" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submit} className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6" noValidate>
              <div>
                <label htmlFor="v-date" className="label">
                  Preferred date
                </label>
                <input
                  id="v-date"
                  type="date"
                  min={isoDate(today)}
                  max={isoDate(maxDate)}
                  value={form.preferredDate}
                  onChange={(e) => update("preferredDate", e.target.value)}
                  className={cn("input", errors.preferredDate && "input-error")}
                />
                {errors.preferredDate && <p className="field-error">{errors.preferredDate}</p>}
              </div>

              <div>
                <span className="label">Preferred time</span>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Time slot">
                  {VIEWING_TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      role="radio"
                      aria-checked={form.preferredTime === slot}
                      onClick={() => update("preferredTime", slot)}
                      className={cn("chip", form.preferredTime === slot && "chip-active")}
                    >
                      {formatTime(slot)}
                    </button>
                  ))}
                </div>
                {errors.preferredTime && <p className="field-error">{errors.preferredTime}</p>}
              </div>

              <div>
                <label htmlFor="v-phone" className="label">
                  Phone number
                </label>
                <input
                  id="v-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="024 123 4567"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className={cn("input", errors.phone && "input-error")}
                />
                {errors.phone ? <p className="field-error">{errors.phone}</p> : <p className="mt-1.5 text-xs text-stone-500">Shared only with this landlord so they can reach you.</p>}
              </div>

              <div>
                <label htmlFor="v-message" className="label">
                  Message to landlord
                </label>
                <textarea
                  id="v-message"
                  rows={4}
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  className={cn("input resize-none", errors.message && "input-error")}
                />
                {errors.message && <p className="field-error">{errors.message}</p>}
              </div>

              <div className="flex flex-col-reverse gap-2 pb-1 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Send request
                </button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}
    </>
  );
}
