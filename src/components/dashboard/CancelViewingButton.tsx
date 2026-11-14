"use client";

import { useRouter } from "next/navigation";
import { useToast } from "../ui/Toast";
import { ConfirmButton } from "../ui/ConfirmButton";

export function CancelViewingButton({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <ConfirmButton
      title="Cancel this viewing request?"
      description="The landlord will no longer see this request. You can send a new one at any time."
      confirmLabel="Cancel request"
      className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50"
      onConfirm={async () => {
        const res = await fetch(`/api/viewings/${id}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast({ title: "Couldn't cancel", description: data.error ?? "Please try again.", variant: "error" });
          return;
        }
        toast({ title: "Viewing request cancelled", variant: "info" });
        router.refresh();
      }}
    >
      Cancel
    </ConfirmButton>
  );
}
