import { fail, ok, readJson, tooManyAttempts, validationFailed } from "@/lib/api";
import { checkLimit, clientIp, LIMITS, recordHits } from "@/lib/rate-limit";
import { resetPasswordWithToken } from "@/lib/password-reset";
import { resetPasswordSchema } from "@/lib/validations";

const REASONS = {
  invalid: "This reset link is invalid. Please request a new one.",
  expired: "This reset link has expired. Please request a new one.",
  used: "This reset link has already been used. Please request a new one.",
} as const;

/** POST /api/auth/reset-password — sets a new password using a one-time emailed token. */
export async function POST(req: Request) {
  const parsed = resetPasswordSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);

  const byIp = LIMITS.resetIp(clientIp(req));
  const limit = await checkLimit(byIp);
  if (!limit.ok) return tooManyAttempts(limit.retryAfterSeconds, "reset attempts");

  const result = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  if (!result.ok) {
    await recordHits([byIp.key]);
    return fail(REASONS[result.reason], 400, { token: REASONS[result.reason] });
  }
  return ok({ ok: true, email: result.email });
}
