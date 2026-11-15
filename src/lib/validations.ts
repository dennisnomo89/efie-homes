import { z } from "zod";
import {
  ADVANCE_MONTH_VALUES,
  AMENITY_VALUES,
  PROPERTY_STATUSES,
  PROPERTY_TYPE_VALUES,
  REGIONS,
  VIEWING_TIME_SLOTS,
} from "./constants";
import { normalizePhone } from "./utils";

/** Ghanaian numbers: 0XX XXX XXXX or +233 XX XXX XXXX (MTN, Telecel, AirtelTigo and landlines). */
export const ghanaPhone = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((v) => /^(?:\+233|0)[2-5]\d{8}$/.test(v), {
    message: "Enter a valid Ghanaian phone number, e.g. 024 123 4567",
  });

const optionalGhanaPhone = z
  .union([z.literal(""), ghanaPhone])
  .optional()
  .transform((v) => (v ? v : undefined));

/** Same strength rule everywhere a password is chosen. */
export const newPasswordRule = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be at most 100 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

const emailRule = z.string().trim().toLowerCase().email("Enter a valid email address");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  email: emailRule,
  phone: optionalGhanaPhone,
  password: newPasswordRule,
  role: z.enum(["TENANT", "LANDLORD"], { error: "Choose an account type" }),
});
export type RegisterInput = z.input<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.input<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email: emailRule });

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(20, "This reset link is invalid").max(200, "This reset link is invalid"),
  password: newPasswordRule,
});

const wholeNumber = (label: string, min: number, max: number) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min.toLocaleString()}`)
    .max(max, `${label} must be at most ${max.toLocaleString()}`);

export const propertySchema = z.object({
  title: z.string().trim().min(10, "Title should be at least 10 characters").max(120, "Keep the title under 120 characters"),
  description: z
    .string()
    .trim()
    .min(40, "Describe the property in at least 40 characters")
    .max(5000, "Description is too long"),
  propertyType: z.enum(PROPERTY_TYPE_VALUES, { error: "Choose a property type" }),
  region: z.enum(REGIONS, { error: "Choose a region" }),
  neighborhood: z.string().trim().min(2, "Enter the neighbourhood").max(80),
  address: z.string().trim().min(3, "Enter a street or landmark address").max(160),
  monthlyRent: wholeNumber("Monthly rent", 100, 2_000_000),
  advanceMonths: z.coerce
    .number()
    .refine((v) => ADVANCE_MONTH_VALUES.includes(v as 6 | 12 | 24), { message: "Choose an advance period" }),
  securityDeposit: wholeNumber("Security deposit", 0, 5_000_000),
  agentFeePercent: wholeNumber("Agent fee", 0, 20),
  bedrooms: wholeNumber("Bedrooms", 0, 20),
  bathrooms: wholeNumber("Bathrooms", 1, 20),
  sizeSqm: z
    .union([z.literal(""), z.null(), wholeNumber("Size", 10, 100_000)])
    .optional()
    .transform((v) => (v === "" || v === null || v === undefined ? null : v)),
  furnished: z.boolean().default(false),
  images: z
    .array(z.string().trim().url("Each image must be a valid URL").max(1000))
    .min(1, "Add at least one image URL")
    .max(12, "You can add up to 12 images"),
  amenities: z.array(z.enum(AMENITY_VALUES)).max(AMENITY_VALUES.length, "Choose each amenity only once").default([]),
  status: z.enum(PROPERTY_STATUSES).default("AVAILABLE"),
});
export type PropertyInput = z.input<typeof propertySchema>;
export type PropertyData = z.output<typeof propertySchema>;

export const propertyStatusSchema = z.object({
  status: z.enum(PROPERTY_STATUSES),
});

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const viewingRequestSchema = z.object({
  propertyId: z.string().min(1),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
    .refine((d) => d >= todayIso(), { message: "Pick today or a future date" })
    .refine(
      (d) => {
        const max = new Date();
        max.setDate(max.getDate() + 90);
        return d <= max.toISOString().slice(0, 10);
      },
      { message: "Viewings can be booked up to 90 days ahead" },
    ),
  preferredTime: z.enum(VIEWING_TIME_SLOTS as [string, ...string[]], {
    error: "Pick a time slot",
  }),
  phone: ghanaPhone,
  message: z.string().trim().min(10, "Add a short message (at least 10 characters)").max(1000),
});
export type ViewingRequestInput = z.input<typeof viewingRequestSchema>;

export const viewingStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "DECLINED"]),
  landlordNote: z.string().trim().max(500).optional(),
});

export const favoriteSchema = z.object({
  propertyId: z.string().min(1),
});

export const profileSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name").max(80),
    phone: optionalGhanaPhone,
    avatarUrl: z
      .union([z.literal(""), z.string().trim().url("Enter a valid image URL")])
      .optional()
      .transform((v) => (v ? v : undefined)),
    currentPassword: z.string().optional(),
    newPassword: z
      .union([
        z.literal(""),
        z
          .string()
          .min(8, "New password must be at least 8 characters")
          .regex(/[A-Za-z]/, "New password must contain a letter")
          .regex(/[0-9]/, "New password must contain a number"),
      ])
      .optional(),
  })
  .refine((v) => !v.newPassword || (v.currentPassword && v.currentPassword.length > 0), {
    message: "Enter your current password to set a new one",
    path: ["currentPassword"],
  });
export type ProfileInput = z.input<typeof profileSchema>;

/** Flattens Zod errors into { field: firstMessage } for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export const adminUserSchema = z.object({
  isVerified: z.boolean(),
});

export const adminPropertySchema = z
  .object({
    isHidden: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  })
  .refine((v) => v.isHidden !== undefined || v.isFeatured !== undefined, { message: "Nothing to update" });
