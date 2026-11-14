"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useToast } from "../ui/Toast";
import { fieldErrors, profileSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";

type Props = { initial: { name: string; phone: string; avatarUrl: string; email: string; role: string } };

export function ProfileForm({ initial }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [v, setV] = useState({ name: initial.name, phone: initial.phone, avatarUrl: initial.avatarUrl, currentPassword: "", newPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof v, value: string) => {
    setV((s) => ({ ...s, [k]: value }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = profileSchema.safeParse(v);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      if (data.errors) setErrors(data.errors);
      toast({ title: "Couldn't save profile", description: data.error ?? "Please try again.", variant: "error" });
      return;
    }
    setV((s) => ({ ...s, currentPassword: "", newPassword: "" }));
    toast({ title: "Profile updated", description: v.newPassword ? "Your password has been changed." : undefined });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2" noValidate>
      <section className="card space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Personal details</h2>
        <div>
          <label className="label">Email</label>
          <input value={initial.email} disabled className="input" />
          <p className="mt-1.5 text-xs text-stone-500">Your email is your login and can&rsquo;t be changed.</p>
        </div>
        <Field label="Full name" error={errors.name}>
          <input value={v.name} onChange={(e) => set("name", e.target.value)} className={cn("input", errors.name && "input-error")} autoComplete="name" />
        </Field>
        <Field label="Phone number" error={errors.phone} hint={initial.role === "TENANT" ? "Pre-filled when you request viewings." : "Shown to tenants after you confirm a viewing."}>
          <input type="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} className={cn("input", errors.phone && "input-error")} placeholder="024 123 4567" autoComplete="tel" />
        </Field>
        <Field label="Profile photo URL" error={errors.avatarUrl}>
          <input type="url" value={v.avatarUrl} onChange={(e) => set("avatarUrl", e.target.value)} className={cn("input", errors.avatarUrl && "input-error")} placeholder="https://…" />
        </Field>
      </section>

      <section className="card flex flex-col gap-4 p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Change password</h2>
        <p className="-mt-2 text-sm text-stone-600">Leave blank to keep your current password.</p>
        <Field label="Current password" error={errors.currentPassword}>
          <input type="password" value={v.currentPassword} onChange={(e) => set("currentPassword", e.target.value)} className={cn("input", errors.currentPassword && "input-error")} autoComplete="current-password" />
        </Field>
        <Field label="New password" error={errors.newPassword} hint="At least 8 characters, with a letter and a number.">
          <input type="password" value={v.newPassword} onChange={(e) => set("newPassword", e.target.value)} className={cn("input", errors.newPassword && "input-error")} autoComplete="new-password" />
        </Field>
        <div className="mt-auto pt-2">
          <button type="submit" disabled={saving} className="btn btn-primary w-full sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
          </button>
        </div>
      </section>
    </form>
  );
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="mt-1.5 text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}
