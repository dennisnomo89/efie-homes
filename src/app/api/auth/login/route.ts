import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { fail, ok, readJson, validationFailed } from "@/lib/api";
import { loginSchema } from "@/lib/validations";

// Used to keep response timing similar when the email does not exist.
let dummyHash: string | null = null;
function getDummyHash() {
  dummyHash ??= bcrypt.hashSync("efie-homes-timing-guard", 12);
  return dummyHash;
}

export async function POST(req: Request) {
  const parsed = loginSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? getDummyHash());
  if (!user || !valid) return fail("Incorrect email or password.", 401);

  await createSession(user);
  return ok({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
