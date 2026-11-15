"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Eye, EyeOff, Loader2, MessageSquareReply, Pencil, Star, Trash2 } from "lucide-react";
import { useToast } from "../ui/Toast";
import { ConfirmButton } from "../ui/ConfirmButton";
import { REVIEW_TEXT_MAX } from "@/lib/validations";
import { cn } from "@/lib/utils";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** Five radio buttons styled as stars — keyboard accessible (arrow keys move between them). */
function StarPicker({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const name = useId();
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer rounded p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-forest-600">
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" />
            <span className="sr-only">
              {n} {n === 1 ? "star" : "stars"} ({LABELS[n]})
            </span>
            <Star aria-hidden="true" className={cn("h-7 w-7", n <= value ? "fill-gold-500 text-gold-500" : "text-stone-300")} />
          </label>
        ))}
        <span className="ml-2 text-sm text-stone-600" aria-hidden="true">
          {LABELS[value] ?? ""}
        </span>
      </div>
    </fieldset>
  );
}

type Existing = { id: string; landlordRating: number; accuracyRating: number; comment: string | null };

/** Tenant: write a review for a past confirmed viewing, or edit / delete their existing one. */
export function ReviewForm({ viewingId, landlordName, existing }: { viewingId: string; landlordName: string; existing?: Existing }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [landlordRating, setLandlordRating] = useState(existing?.landlordRating ?? 0);
  const [accuracyRating, setAccuracyRating] = useState(existing?.accuracyRating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const commentId = useId();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!landlordRating || !accuracyRating) return setError("Please choose a star rating for both questions.");
    setBusy(true);
    setError("");
    const res = await fetch(existing ? `/api/reviews/${existing.id}` : "/api/reviews", {
      method: existing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        existing ? { landlordRating, accuracyRating, comment: comment.trim() } : { viewingRequestId: viewingId, landlordRating, accuracyRating, comment: comment.trim() },
      ),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Couldn't save your review. Please try again.");
    toast({ title: existing ? "Review updated" : "Thanks for your review!", description: existing ? undefined : `${landlordName} has been notified.`, variant: "success" });
    setOpen(false);
    router.refresh();
  }

  async function remove() {
    const res = await fetch(`/api/reviews/${existing!.id}`, { method: "DELETE" });
    if (!res.ok) return toast({ title: "Couldn't delete review", description: "Please try again.", variant: "error" });
    toast({ title: "Review deleted", variant: "info" });
    router.refresh();
  }

  if (!open) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => setOpen(true)} className={cn("btn btn-sm", existing ? "btn-ghost" : "btn-primary")}>
          {existing ? <Pencil className="h-4 w-4" /> : <Star className="h-4 w-4" />}
          {existing ? "Edit review" : "Leave a review"}
        </button>
        {existing && (
          <ConfirmButton
            title="Delete your review?"
            description="It will be removed from the landlord's profile. You can't undo this."
            confirmLabel="Delete review"
            onConfirm={remove}
            className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </ConfirmButton>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
      <StarPicker label={`How was ${landlordName} to deal with?`} value={landlordRating} onChange={setLandlordRating} />
      <StarPicker label="Did the home match the listing?" value={accuracyRating} onChange={setAccuracyRating} />
      <div>
        <label htmlFor={commentId} className="label">
          Your review <span className="font-normal text-stone-500">(optional)</span>
        </label>
        <textarea
          id={commentId}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={REVIEW_TEXT_MAX}
          rows={4}
          className="input"
          placeholder="Was the landlord on time? Were the photos and rent accurate? Anything future tenants should know?"
        />
        <p className="mt-1 text-xs text-stone-500">
          Shown publicly with your first name and initial. {comment.length}/{REVIEW_TEXT_MAX}
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn btn-sm btn-primary">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {existing ? "Save changes" : "Post review"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-sm btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Landlord: post or edit a public reply to a review of them. */
export function ReplyForm({ reviewId, existingReply }: { reviewId: string; existingReply: string | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reply, setReply] = useState(existingReply ?? "");
  const replyId = useId();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ landlordReply: reply }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Couldn't save your reply. Please try again.");
    toast({ title: existingReply ? "Reply updated" : "Reply posted", variant: "success" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-sm btn-ghost">
        <MessageSquareReply className="h-4 w-4" /> {existingReply ? "Edit reply" : "Reply publicly"}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor={replyId} className="label">
        Your public reply
      </label>
      <textarea
        id={replyId}
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        maxLength={REVIEW_TEXT_MAX}
        rows={3}
        required
        className="input"
        placeholder="Thank the tenant, or politely give your side."
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={busy || !reply.trim()} className="btn btn-sm btn-primary">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Post reply
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-sm btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Admin: hide an abusive review from the public, or show it again. */
export function HideReviewButton({ reviewId, isHidden }: { reviewId: string; isHidden: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHidden: !isHidden }),
    });
    setBusy(false);
    if (!res.ok) return toast({ title: "Couldn't update review", description: "Please try again.", variant: "error" });
    toast({ title: isHidden ? "Review visible again" : "Review hidden", variant: "info" });
    router.refresh();
  }

  return (
    <button type="button" onClick={toggle} disabled={busy} className="btn btn-sm btn-ghost">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      {isHidden ? "Show review" : "Hide review"}
    </button>
  );
}
