/** Comparing homes side by side: the selection lives in the browser and in the /compare?ids=… link (no account needed). */

export const MAX_COMPARE = 3;

const ID_PATTERN = /^[a-z0-9]{10,40}$/i;

/** "a,b,b,junk!,c,d" → up to MAX_COMPARE unique, well-formed ids, in order. */
export function parseCompareIds(value: string | string[] | undefined | null): string[] {
  const raw = Array.isArray(value) ? value.join(",") : (value ?? "");
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const id = part.trim();
    if (ID_PATTERN.test(id) && !out.includes(id)) out.push(id);
    if (out.length === MAX_COMPARE) break;
  }
  return out;
}

export type ToggleResult = { ids: string[]; outcome: "added" | "removed" | "full" };

/** Adds or removes one home; refuses to add a fourth. */
export function toggleCompareId(ids: string[], id: string): ToggleResult {
  if (ids.includes(id)) return { ids: ids.filter((x) => x !== id), outcome: "removed" };
  if (ids.length >= MAX_COMPARE) return { ids, outcome: "full" };
  return { ids: [...ids, id], outcome: "added" };
}

export const compareHref = (ids: string[]) => `/compare?ids=${ids.join(",")}`;
