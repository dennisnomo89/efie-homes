import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, publicUserSelect } from "@/lib/auth";
import { fail, guard, ok, readJson, validationFailed } from "@/lib/api";
import { profileSchema } from "@/lib/validations";

/** PATCH /api/profile — update name, phone, avatar and optionally the password. */
export async function PATCH(req: Request) {
  const g = await guard();
  if (g.response) return g.response;

  const parsed = profileSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);
  const { name, phone, avatarUrl, currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: g.session.sub } });
  if (!user) return fail("Account not found.", 404);

  let passwordHash: string | undefined;
  if (newPassword) {
    const valid = await bcrypt.compare(currentPassword ?? "", user.passwordHash);
    if (!valid) return fail("Your current password is incorrect.", 422, { currentPassword: "Incorrect password" });
    passwordHash = await bcrypt.hash(newPassword, 12);
  }

  const { sessionVersion, ...updated } = await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      phone: phone ?? null,
      avatarUrl: avatarUrl ?? null,
      // A new password signs out every other device.
      ...(passwordHash ? { passwordHash, sessionVersion: { increment: 1 } } : {}),
    },
    select: { ...publicUserSelect, sessionVersion: true },
  });

  // Re-issue this device's session (new name, and the new session version after a password change).
  await createSession({ ...updated, sessionVersion });
  return ok({ user: updated, signedOutOtherDevices: Boolean(passwordHash) });
}
