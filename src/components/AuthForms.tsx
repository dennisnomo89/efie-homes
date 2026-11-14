"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, Eye, EyeOff, KeyRound, Loader2, UserRound } from "lucide-react";
import { useToast } from "./ui/Toast";
import { fieldErrors, loginSchema, registerSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";

function safeNext(next: string | undefined, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

function homeFor(role: string) {
  return role === "LANDLORD" || role === "ADMIN" ? "/dashboard/landlord" : "/dashboard/tenant";
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setErrors(data.errors ?? { _form: data.error ?? "Something went wrong" });
      return;
    }
    toast({ title: `Akwaaba, ${data.user.name.split(" ")[0]}!`, description: "You're signed in." });
    router.push(safeNext(next, homeFor(data.user.role)));
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {errors._form && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{errors._form}</p>}
      <Field label="Email" error={errors.email}>
        <input
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={cn("input", errors.email && "input-error")}
          placeholder="you@example.com"
        />
      </Field>
      <Field label="Password" error={errors.password}>
        <PasswordInput value={form.password} onChange={(v) => setForm({ ...form, password: v })} invalid={!!errors.password} autoComplete="current-password" />
      </Field>
      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Log in
      </button>
      <p className="text-center text-sm text-stone-600">
        New to Efie Homes?{" "}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-forest-800 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ defaultRole, next }: { defaultRole: "TENANT" | "LANDLORD"; next?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: defaultRole });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setErrors(data.errors ?? { _form: data.error ?? "Something went wrong" });
      return;
    }
    toast({ title: "Account created — akwaaba!", description: form.role === "LANDLORD" ? "Add your first listing to start receiving viewing requests." : "Start saving homes and booking viewings." });
    router.push(form.role === "LANDLORD" ? "/dashboard/landlord" : safeNext(next, "/properties"));
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {errors._form && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{errors._form}</p>}

      <fieldset>
        <legend className="label">I want to</legend>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "TENANT", title: "Rent a home", sub: "Tenant", icon: UserRound },
              { value: "LANDLORD", title: "List property", sub: "Landlord / Agent", icon: Building2 },
            ] as const
          ).map((r) => (
            <label
              key={r.value}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-2xl border-2 p-4 transition",
                form.role === r.value ? "border-forest-700 bg-forest-50" : "border-stone-200 bg-white hover:border-stone-300",
              )}
            >
              <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={() => set("role", r.value)} className="sr-only" />
              <r.icon className={cn("h-5 w-5", form.role === r.value ? "text-forest-700" : "text-stone-500")} />
              <span className="mt-1 text-sm font-semibold">{r.title}</span>
              <span className="text-xs text-stone-500">{r.sub}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label={form.role === "LANDLORD" ? "Full name or agency name" : "Full name"} error={errors.name}>
        <input autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} className={cn("input", errors.name && "input-error")} placeholder="Ama Mensah" />
      </Field>
      <Field label="Email" error={errors.email}>
        <input type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={cn("input", errors.email && "input-error")} placeholder="you@example.com" />
      </Field>
      <Field label="Phone (optional)" error={errors.phone}>
        <input type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={cn("input", errors.phone && "input-error")} placeholder="024 123 4567" />
      </Field>
      <Field label="Password" error={errors.password} hint="At least 8 characters, with a letter and a number.">
        <PasswordInput value={form.password} onChange={(v) => set("password", v)} invalid={!!errors.password} autoComplete="new-password" />
      </Field>

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Create account
      </button>
      <p className="text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-forest-800 hover:underline">
          Log in
        </Link>
      </p>
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

function PasswordInput({ value, onChange, invalid, autoComplete }: { value: string; onChange: (v: string) => void; invalid: boolean; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("input pr-12", invalid && "input-error")}
        placeholder="••••••••"
      />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-stone-500 hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
