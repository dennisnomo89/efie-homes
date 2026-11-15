import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, publicUserSelect } from "@/lib/auth";
import { fail, ok, readJson, tooManyAttempts, validationFailed } from "@/lib/api";
import { checkLimit, clientIp, LIMITS, recordHits } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const parsed = registerSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);
  const { name, email, phone, password, role } = parsed.data;

  const byIp = LIMITS.registerIp(clientIp(req));
  const limit = await checkLimit(byIp);
  if (!limit.ok) return tooManyAttempts(limit.retryAfterSeconds, "new accounts from your network");

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return fail("An account with this email already exists.", 409, { email: "This email is already registered" });

  const passwordHash = await bcrypt.hash(password, 12);
  const { sessionVersion, ...user } = await prisma.user.create({
    data: { name, email, phone, passwordHash, role },
    select: { ...publicUserSelect, sessionVersion: true },
  });

  await recordHits([byIp.key]);
  await createSession({ ...user, sessionVersion });
  return ok({ user }, 201);
}
