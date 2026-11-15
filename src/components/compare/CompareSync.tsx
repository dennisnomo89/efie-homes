"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { X } from "lucide-react";
import { compareStore } from "./compare-store";
import { compareHref } from "@/lib/compare";

/** Opening a /compare link (maybe shared by someone else) makes those homes the current selection. */
export function CompareSync({ ids }: { ids: string[] }) {
  useEffect(() => {
    compareStore.set(ids);
  }, [ids]);
  return null;
}

export function RemoveFromCompare({ id, ids, title }: { id: string; ids: string[]; title: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        const rest = ids.filter((x) => x !== id);
        compareStore.set(rest);
        router.replace(rest.length ? compareHref(rest) : "/compare", { scroll: false });
      }}
      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-stone-700 shadow-sm hover:bg-white"
      aria-label={`Remove ${title} from the comparison`}
    >
      <X className="h-4 w-4" />
    </button>
  );
}
