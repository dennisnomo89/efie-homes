import { prisma } from "@/lib/prisma";
import { fail, guard, ok, readJson, validationFailed } from "@/lib/api";
import { describeSearch, filtersFromQuery, hasCriteria, MAX_SAVED_SEARCHES, normalizeSearchQuery, savedSearchesWithCounts } from "@/lib/saved-searches";
import { savedSearchCreateSchema } from "@/lib/validations";

/** GET /api/saved-searches — the tenant's saved searches, each with its count of new matches. */
export async function GET() {
  const g = await guard(["TENANT"]);
  if (g.response) return g.response;

  return ok({ searches: await savedSearchesWithCounts(g.session.sub), max: MAX_SAVED_SEARCHES });
}

/** POST /api/saved-searches — save the current listings search (returns the existing one if already saved). */
export async function POST(req: Request) {
  const g = await guard(["TENANT"]);
  if (g.response) return g.response;

  const parsed = savedSearchCreateSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);

  const filters = filtersFromQuery(parsed.data.query.replace(/^\?/, ""));
  if (!hasCriteria(filters)) {
    return fail("Choose at least one filter (a location, type, budget…) before saving a search.", 422, { query: "Add a filter first" });
  }
  const query = normalizeSearchQuery(filters);

  const existing = await prisma.savedSearch.findUnique({ where: { userId_query: { userId: g.session.sub, query } } });
  if (existing) return ok({ search: existing, alreadySaved: true });

  const count = await prisma.savedSearch.count({ where: { userId: g.session.sub } });
  if (count >= MAX_SAVED_SEARCHES) {
    return fail(`You can save up to ${MAX_SAVED_SEARCHES} searches. Delete one in your dashboard to save this.`, 409);
  }

  const search = await prisma.savedSearch.create({
    data: { userId: g.session.sub, query, name: describeSearch(filters) },
  });
  return ok({ search, alreadySaved: false }, 201);
}
