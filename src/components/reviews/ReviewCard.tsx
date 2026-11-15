import { EyeOff, MessageSquareReply } from "lucide-react";
import { Stars } from "./Stars";
import { formatDate } from "@/lib/utils";

export type ReviewForDisplay = {
  id: string;
  landlordRating: number;
  accuracyRating: number;
  comment: string | null;
  landlordReply: string | null;
  repliedAt: Date | null;
  isHidden: boolean;
  propertyTitle: string;
  createdAt: Date;
  tenant: { name: string };
  landlord?: { name: string };
};

/** "Ama Serwaa" → "Ama S." so reviewers aren't fully identified in public. */
export function shortName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
}

export function ReviewCard({ review, actions }: { review: ReviewForDisplay; actions?: React.ReactNode }) {
  return (
    <article className={`card p-5 ${review.isHidden ? "border-terracotta-200 bg-terracotta-50/40" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{shortName(review.tenant.name)}</p>
          <p className="text-xs text-stone-500">
            Viewed {review.propertyTitle} · {formatDate(review.createdAt, { month: "short", year: "numeric" })}
          </p>
        </div>
        {review.isHidden && (
          <span className="badge bg-terracotta-100 text-terracotta-700">
            <EyeOff className="h-3.5 w-3.5" /> Hidden by admin
          </span>
        )}
      </div>
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div className="flex items-center gap-2">
          <dt className="text-stone-600">Landlord</dt>
          <dd>
            <Stars value={review.landlordRating} />
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-stone-600">Listing accuracy</dt>
          <dd>
            <Stars value={review.accuracyRating} />
          </dd>
        </div>
      </dl>
      {review.comment && <p className="mt-3 whitespace-pre-line text-sm text-stone-700">{review.comment}</p>}
      {review.landlordReply && (
        <div className="mt-3 flex gap-2 rounded-xl bg-sand p-3 text-sm">
          <MessageSquareReply className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />
          <div>
            <p className="font-semibold">Reply from {review.landlord ? review.landlord.name.split(" ")[0] : "the landlord"}</p>
            <p className="whitespace-pre-line text-stone-700">{review.landlordReply}</p>
          </div>
        </div>
      )}
      {actions && <div className="mt-3">{actions}</div>}
    </article>
  );
}
