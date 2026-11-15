import { ok } from "@/lib/api";
import { parseFilters, searchMapPins } from "@/lib/properties";

/** GET /api/properties/map — map pins (rounded to ~100 m) for listings matching the usual search filters. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  return ok(await searchMapPins(parseFilters(searchParams)));
}
