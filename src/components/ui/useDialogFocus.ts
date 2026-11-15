"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Accessible focus handling for a modal dialog / drawer while `open`:
 *  - moves keyboard focus into the dialog (to `initialSelector`, else the first focusable element),
 *  - keeps Tab / Shift+Tab cycling inside it,
 *  - returns focus to whatever was focused before (usually the button that opened it) when it closes.
 * Works with dialogs rendered through <Portal>, which mount a moment after `open` turns true.
 */
export function useDialogFocus(open: boolean, ref: RefObject<HTMLElement | null>, initialSelector?: string) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    let cancelled = false;
    let attempts = 0;

    const focusables = (root: HTMLElement) =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => !n.closest("[aria-hidden='true']"));

    const focusInitial = () => {
      if (cancelled) return;
      const root = ref.current;
      if (!root) {
        if (attempts++ < 20) setTimeout(focusInitial, 16); // wait for the portal to mount
        return;
      }
      if (root.contains(document.activeElement)) return;
      const target = (initialSelector && root.querySelector<HTMLElement>(initialSelector)) || focusables(root)[0] || root;
      if (target === root && !root.hasAttribute("tabindex")) root.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    };
    focusInitial();

    const onKey = (e: KeyboardEvent) => {
      const root = ref.current;
      if (e.key !== "Tab" || !root) return;
      const items = focusables(root);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !root.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      cancelled = true;
      document.removeEventListener("keydown", onKey);
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [open, ref, initialSelector]);
}
