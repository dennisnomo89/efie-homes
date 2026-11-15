"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Flag, Loader2, X } from "lucide-react";
import { useToast } from "./ui/Toast";
import { Portal } from "./ui/Portal";
import { useDialogFocus } from "./ui/useDialogFocus";
import { REPORT_REASONS, type ReportReason } from "@/lib/constants";
import { REPORT_DETAILS_MAX } from "@/lib/validations";
import { cn, formatDate } from "@/lib/utils";

type Props = {
  propertyId: string;
  propertyTitle: string;
  signedIn: boolean;
  /** When this person already has an open report on the listing (then the form is not offered again). */
  reportedAt: Date | string | null;
};

export function ReportListingButton({ propertyId, propertyTitle, signedIn, reportedAt }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(open, dialogRef, "input");

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

  if (reportedAt) {
    return (
      <p className="flex items-center justify-center gap-1.5 text-xs text-stone-500">
        <Flag className="h-3.5 w-3.5" /> You reported this listing on {formatDate(reportedAt)}. Our team is looking into it.
      </p>
    );
  }

  if (!signedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(`/properties/${propertyId}`)}`}
        className="flex items-center justify-center gap-1.5 text-xs font-medium text-stone-500 hover:text-terracotta-700 hover:underline"
      >
        <Flag className="h-3.5 w-3.5" /> Log in to report this listing
      </Link>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return setErrors({ reason: "Choose a reason" });
    if (reason === "OTHER" && !details.trim()) return setErrors({ details: "Tell us what's wrong" });
    setBusy(true);
    setErrors({});
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, reason, details: details.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      if (data.errors) setErrors(data.errors);
      toast({ title: "Report not sent", description: data.error ?? "Please try again.", variant: "error" });
      return;
    }
    setOpen(false);
    toast({ title: "Thanks for letting us know", description: "Our team will check this listing." });
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto flex items-center justify-center gap-1.5 text-xs font-medium text-stone-500 hover:text-terracotta-700 hover:underline"
      >
        <Flag className="h-3.5 w-3.5" /> Report this listing
      </button>

      {open && (
        <Portal>
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="report-title">
            <div className="absolute inset-0 animate-fade-in bg-ink/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div ref={dialogRef} className="relative flex max-h-[92vh] w-full max-w-lg animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
              <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-5 py-4 sm:px-6">
                <div>
                  <h2 id="report-title" className="font-display text-xl font-semibold">
                    Report this listing
                  </h2>
                  <p className="mt-0.5 line-clamp-1 text-sm text-stone-500">{propertyTitle}</p>
                </div>
                <button onClick={() => setOpen(false)} className="-mr-2 flex h-10 w-10 items-center justify-center rounded-xl hover:bg-stone-100" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={submit} className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6" noValidate>
                <fieldset>
                  <legend className="label">What&rsquo;s wrong?</legend>
                  <div className="space-y-2">
                    {REPORT_REASONS.map((r) => (
                      <label
                        key={r.value}
                        className={cn(
                          "flex cursor-pointer gap-3 rounded-xl border p-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-forest-600",
                          reason === r.value ? "border-forest-600 bg-forest-50" : "border-stone-200 hover:bg-stone-50",
                        )}
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={r.value}
                          checked={reason === r.value}
                          onChange={() => {
                            setReason(r.value);
                            setErrors({});
                          }}
                          className="mt-1 accent-forest-700"
                        />
                        <span>
                          <span className="block text-sm font-semibold">{r.label}</span>
                          <span className="block text-xs text-stone-600">{r.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.reason && <p className="field-error">{errors.reason}</p>}
                </fieldset>

                <div>
                  <label htmlFor="report-details" className="label">
                    Details {reason !== "OTHER" && <span className="font-normal text-stone-500">(optional)</span>}
                  </label>
                  <textarea
                    id="report-details"
                    rows={3}
                    value={details}
                    maxLength={REPORT_DETAILS_MAX}
                    onChange={(e) => setDetails(e.target.value)}
                    className={cn("input resize-none", errors.details && "input-error")}
                    placeholder="e.g. The agent asked me to pay a viewing fee by MoMo before showing me the house."
                  />
                  {errors.details && <p className="field-error">{errors.details}</p>}
                  <p className="mt-1.5 text-xs text-stone-500">Only our team sees this. The landlord isn&rsquo;t told who reported the listing.</p>
                </div>

                <p className="rounded-xl bg-sand p-3 text-xs text-stone-700">
                  <strong>Stay safe:</strong> never pay rent, an advance or a &ldquo;viewing fee&rdquo; before you&rsquo;ve seen the home and met the landlord or agent in person.
                </p>

                <div className="flex flex-col-reverse gap-2 pb-1 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setOpen(false)} className="btn btn-outline">
                    Cancel
                  </button>
                  <button type="submit" disabled={busy} className="btn btn-primary">
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send report
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
