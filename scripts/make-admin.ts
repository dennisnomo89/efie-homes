/* Promote an existing account to ADMIN.
 *
 *   npm run make-admin -- you@example.com
 *
 * Uses the database in .env. The person must log out and back in afterwards,
 * because page routing reads the role from their session cookie.
 */
import { prisma } from "../src/lib/prisma";


async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.error("Usage: npm run make-admin -- you@example.com");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, role: true } });
  if (!user) {
    console.error(`No account with the email ${email}. Register on the site first, then run this again.`);
    process.exit(1);
  }
  if (user.role === "ADMIN") {
    console.log(`${user.name} (${email}) is already an admin.`);
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN", isVerified: true } });
  console.log(`✅ ${user.name} (${email}) is now an admin (was ${user.role}). Log out and back in to see the Admin dashboard.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
