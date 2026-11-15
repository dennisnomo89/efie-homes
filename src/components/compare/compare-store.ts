"use client";

import { useSyncExternalStore } from "react";
import { parseCompareIds, toggleCompareId, type ToggleResult } from "@/lib/compare";

/*
 * The homes picked for comparison, shared by every Compare button and the tray.
 * Kept in localStorage so the selection survives page loads; other tabs stay in step via the storage event.
 */

const KEY = "efie:compare";
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let cache: string[] | null = null;

function read(): string[] {
  if (cache) return cache;
  try {
    cache = parseCompareIds(window.localStorage.getItem(KEY));
  } catch {
    cache = [];
  }
  return cache;
}

function write(ids: string[]) {
  cache = ids;
  try {
    window.localStorage.setItem(KEY, ids.join(","));
  } catch {
    /* private mode / storage blocked: the selection lasts until the page is closed */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCompareIds(): string[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const compareStore = {
  toggle(id: string): ToggleResult {
    const result = toggleCompareId(read(), id);
    if (result.outcome !== "full") write(result.ids);
    return result;
  },
  set(ids: string[]) {
    write(parseCompareIds(ids.join(",")));
  },
  clear() {
    write([]);
  },
};
