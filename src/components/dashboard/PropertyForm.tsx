"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { useToast } from "../ui/Toast";
import { SafeImage } from "../ui/SafeImage";
import { AmenityIcon } from "../AmenityIcon";
import { ADVANCE_OPTIONS, AMENITIES, NEIGHBORHOODS, PROPERTY_TYPES, REGIONS } from "@/lib/constants";
import { calculateUpfront } from "@/lib/pricing";
import { fieldErrors, propertySchema } from "@/lib/validations";
import { cn, formatCedis } from "@/lib/utils";

export type PropertyFormValues = {
  title: string;
  description: string;
  propertyType: string;
  region: string;
  neighborhood: string;
  address: string;
  monthlyRent: string;
  advanceMonths: string;
  securityDeposit: string;
  agentFeePercent: string;
  bedrooms: string;
  bathrooms: string;
  sizeSqm: string;
  furnished: boolean;
  images: string[];
  amenities: string[];
  status: "AVAILABLE" | "RENTED";
};

export const EMPTY_PROPERTY: PropertyFormValues = {
  title: "",
  description: "",
  propertyType: "APARTMENT_2BR",
  region: "Greater Accra",
  neighborhood: "",
  address: "",
  monthlyRent: "",
  advanceMonths: "12",
  securityDeposit: "0",
  agentFeePercent: "0",
  bedrooms: "2",
  bathrooms: "1",
  sizeSqm: "",
  furnished: false,
  images: [],
  amenities: ["ECG_PREPAID"],
  status: "AVAILABLE",
};

export function PropertyForm({ initial = EMPTY_PROPERTY, propertyId }: { initial?: PropertyFormValues; propertyId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [v, setV] = useState<PropertyFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const editing = Boolean(propertyId);

  const set = <K extends keyof PropertyFormValues>(k: K, value: PropertyFormValues[K]) => {
    setV((s) => ({ ...s, [k]: value }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const hoods = NEIGHBORHOODS[v.region as keyof typeof NEIGHBORHOODS] ?? [];
  const rent = Number(v.monthlyRent) || 0;
  const months = Number(v.advanceMonths) || 0;
  const upfront = useMemo(
    () =>
      calculateUpfront({
        monthlyRent: rent,
        months,
        agentFeePercent: Number(v.agentFeePercent) || 0,
        securityDeposit: Number(v.securityDeposit) || 0,
      }).total,
    [rent, months, v.agentFeePercent, v.securityDeposit],
  );

  function addImage() {
    const url = imageUrl.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      setErrors((e) => ({ ...e, images: "That doesn't look like a valid URL" }));
      return;
    }
    if (v.images.includes(url)) return setImageUrl("");
    if (v.images.length >= 12) return setErrors((e) => ({ ...e, images: "You can add up to 12 images" }));
    set("images", [...v.images, url]);
    setImageUrl("");
  }

  function moveImage(i: number, dir: -1 | 1) {
    const next = [...v.images];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    set("images", next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...v, sizeSqm: v.sizeSqm === "" ? null : v.sizeSqm };
    const parsed = propertySchema.safeParse(payload);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      toast({ title: "Please check the form", description: Object.values(errs)[0], variant: "error" });
      document.getElementById(`f-${Object.keys(errs)[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSaving(true);
    const res = await fetch(editing ? `/api/properties/${propertyId}` : "/api/properties", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      if (data.errors) setErrors(data.errors);
      toast({ title: "Couldn't save listing", description: data.error ?? "Please try again.", variant: "error" });
      return;
    }
    toast({ title: editing ? "Listing updated" : "Listing published!", description: editing ? undefined : "Tenants can now find and request viewings." });
    router.push(editing ? "/dashboard/landlord" : `/properties/${data.property.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_320px]" noValidate>
      <div className="space-y-8">
        <Card title="Basics" subtitle="A clear title and honest description get more viewing requests.">
          <Field id="title" label="Listing title" error={errors.title}>
            <input id="f-title" value={v.title} onChange={(e) => set("title", e.target.value)} className={cn("input", errors.title && "input-error")} placeholder="e.g. Neat 2-Bedroom Apartment, Spintex Road" />
          </Field>
          <Field id="description" label="Description" error={errors.description} hint={`${v.description.length} / 5000`}>
            <textarea
              id="f-description"
              rows={6}
              value={v.description}
              onChange={(e) => set("description", e.target.value)}
              className={cn("input", errors.description && "input-error")}
              placeholder="Describe the rooms, finishing, water and power situation, nearby landmarks, and who it's ideal for."
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="propertyType" label="Property type" error={errors.propertyType}>
              <select id="f-propertyType" value={v.propertyType} onChange={(e) => set("propertyType", e.target.value)} className="input">
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex min-h-[44px] cursor-pointer items-center justify-between self-end rounded-xl border border-stone-300 bg-white px-4">
              <span className="text-sm font-medium">Furnished</span>
              <input type="checkbox" checked={v.furnished} onChange={(e) => set("furnished", e.target.checked)} className="h-5 w-5 accent-forest-700" />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field id="bedrooms" label="Bedrooms" error={errors.bedrooms}>
              <input id="f-bedrooms" type="number" inputMode="numeric" min={0} value={v.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className={cn("input", errors.bedrooms && "input-error")} />
            </Field>
            <Field id="bathrooms" label="Bathrooms" error={errors.bathrooms}>
              <input id="f-bathrooms" type="number" inputMode="numeric" min={1} value={v.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className={cn("input", errors.bathrooms && "input-error")} />
            </Field>
            <Field id="sizeSqm" label="Size (m²)" error={errors.sizeSqm}>
              <input id="f-sizeSqm" type="number" inputMode="numeric" min={0} value={v.sizeSqm} onChange={(e) => set("sizeSqm", e.target.value)} className={cn("input", errors.sizeSqm && "input-error")} placeholder="Optional" />
            </Field>
          </div>
        </Card>

        <Card title="Location">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="region" label="Region" error={errors.region}>
              <select id="f-region" value={v.region} onChange={(e) => set("region", e.target.value)} className="input">
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="neighborhood" label="Neighbourhood" error={errors.neighborhood}>
              <input id="f-neighborhood" list="form-hoods" value={v.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} className={cn("input", errors.neighborhood && "input-error")} placeholder="e.g. East Legon" />
              <datalist id="form-hoods">
                {hoods.map((h) => (
                  <option key={h} value={h} />
                ))}
              </datalist>
            </Field>
          </div>
          <Field id="address" label="Street / landmark" error={errors.address}>
            <input id="f-address" value={v.address} onChange={(e) => set("address", e.target.value)} className={cn("input", errors.address && "input-error")} placeholder="e.g. Off Lagos Avenue, near Shell filling station" />
          </Field>
        </Card>

        <Card title="Rent & advance" subtitle="All amounts in Ghana Cedis (GHS).">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="monthlyRent" label="Monthly rent (₵)" error={errors.monthlyRent}>
              <input id="f-monthlyRent" type="number" inputMode="numeric" min={0} value={v.monthlyRent} onChange={(e) => set("monthlyRent", e.target.value)} className={cn("input", errors.monthlyRent && "input-error")} placeholder="3500" />
            </Field>
            <Field id="securityDeposit" label="Security deposit (₵)" error={errors.securityDeposit}>
              <input id="f-securityDeposit" type="number" inputMode="numeric" min={0} value={v.securityDeposit} onChange={(e) => set("securityDeposit", e.target.value)} className={cn("input", errors.securityDeposit && "input-error")} />
            </Field>
          </div>
          <Field id="advanceMonths" label="Minimum advance" error={errors.advanceMonths}>
            <div id="f-advanceMonths" className="grid grid-cols-3 gap-2">
              {ADVANCE_OPTIONS.map((a) => (
                <button key={a.months} type="button" onClick={() => set("advanceMonths", String(a.months))} className={cn("chip", v.advanceMonths === String(a.months) && "chip-active")}>
                  {a.label}
                </button>
              ))}
            </div>
          </Field>
          <Field id="agentFeePercent" label="Agent commission (% of advance)" error={errors.agentFeePercent} hint="Use 0 if you are the owner listing directly. 10% is common for agents.">
            <input id="f-agentFeePercent" type="number" inputMode="numeric" min={0} max={20} value={v.agentFeePercent} onChange={(e) => set("agentFeePercent", e.target.value)} className={cn("input sm:max-w-[200px]", errors.agentFeePercent && "input-error")} />
          </Field>
        </Card>

        <Card title="Utilities & amenities">
          <div className="grid gap-2 sm:grid-cols-2">
            {AMENITIES.map((a) => {
              const on = v.amenities.includes(a.value);
              return (
                <label key={a.value} className={cn("flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border px-3 text-sm transition", on ? "border-forest-600 bg-forest-50" : "border-stone-200 bg-white hover:border-stone-300")}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => set("amenities", on ? v.amenities.filter((x) => x !== a.value) : [...v.amenities, a.value])}
                    className="h-5 w-5 accent-forest-700"
                  />
                  <AmenityIcon amenity={a.value} className={cn("h-4 w-4", on ? "text-forest-700" : "text-stone-400")} />
                  <span className="font-medium">{a.label}</span>
                </label>
              );
            })}
          </div>
        </Card>

        <Card title="Photos" subtitle="Paste direct image URLs. The first photo is the cover image.">
          <div className="flex gap-2">
            <input
              id="f-images"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setErrors((er) => ({ ...er, images: "" }));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addImage();
                }
              }}
              type="url"
              placeholder="https://…/photo.jpg"
              className={cn("input", errors.images && "input-error")}
            />
            <button type="button" onClick={addImage} className="btn btn-outline shrink-0">
              <ImagePlus className="h-4 w-4" /> Add
            </button>
          </div>
          {errors.images && <p className="field-error">{errors.images}</p>}
          {v.images.length > 0 && (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {v.images.map((src, i) => (
                <li key={src} className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white">
                  <SafeImage src={src} alt={`Photo ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                  {i === 0 && <span className="badge absolute left-2 top-2 bg-gold-400 text-ink">Cover</span>}
                  <div className="flex justify-between p-1.5">
                    <div className="flex">
                      <IconBtn label="Move earlier" onClick={() => moveImage(i, -1)} disabled={i === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn label="Move later" onClick={() => moveImage(i, 1)} disabled={i === v.images.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                      </IconBtn>
                    </div>
                    <IconBtn label="Remove photo" onClick={() => set("images", v.images.filter((x) => x !== src))} danger>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ---------- Summary sidebar ---------- */}
      <aside>
        <div className="card space-y-4 p-5 lg:sticky lg:top-24">
          <h3 className="font-semibold">Listing summary</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-600">Monthly rent</dt>
              <dd className="font-medium">{rent ? formatCedis(rent) : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-600">Minimum advance</dt>
              <dd className="font-medium">{months} months</dd>
            </div>
            <div className="flex justify-between border-t border-dashed border-stone-200 pt-2">
              <dt className="font-semibold">Tenant pays upfront</dt>
              <dd className="font-display text-lg font-semibold text-forest-800">{rent ? formatCedis(upfront) : "—"}</dd>
            </div>
          </dl>
          {editing && (
            <div>
              <span className="label">Status</span>
              <div className="grid grid-cols-2 gap-2">
                {(["AVAILABLE", "RENTED"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => set("status", s)} className={cn("chip", v.status === s && "chip-active")}>
                    {s === "AVAILABLE" ? "Available" : "Rented"}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button type="submit" disabled={saving} className="btn btn-primary w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editing ? "Save changes" : "Publish listing"}
          </button>
          <button type="button" onClick={() => router.back()} className="btn btn-ghost w-full">
            Cancel
          </button>
        </div>
      </aside>
    </form>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-stone-600">{subtitle}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={`f-${id}`} className="label">
        {label}
      </label>
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="mt-1.5 text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-30", danger && "text-red-600 hover:bg-red-50")}>
      {children}
    </button>
  );
}
