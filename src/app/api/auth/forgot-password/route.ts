import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, readJson, validationFailed } from "@/lib/api";
import { appUrl, sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email-templates";
import { createResetToken, RESET_TOKEN_MINUTES } from "@/lib/password-reset";
import { forgotPasswordSchema } from "@/lib/validations";

const GENERIC_REPLY = {
  ok: true,
  message: "If an account exists for that email, we've sent a link to reset the password. It expires in 60 minutes.",
};

/**
 * POST /api/auth/forgot-password — always gives the same reply, so it can't be used
 * to find out which emails have accounts. The email itself is sent after the response.
 */
export async function POST(req: Request) {
  const parsed = forgotPasswordSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);

  const email = parsed.data.email;
  after(async () => {
    try {
      const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true } });
      if (!user) return;
      const token = await createResetToken(user.id);
      if (!token) return; // hourly limit reached
      const message = passwordResetEmail({
        name: user.name,
        resetUrl: `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`,
        minutes: RESET_TOKEN_MINUTES,
      });
      await sendEmail({ to: user.email, ...message });
    } catch (err) {
      console.error("[forgot-password]", err instanceof Error ? err.message : err);
    }
  });

  return ok(GENERIC_REPLY);
}
