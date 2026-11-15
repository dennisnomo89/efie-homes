"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { useToast } from "./ui/Toast";
import { cn } from "@/lib/utils";

/**
 * Share a listing. On phones that support it, opens the system share sheet (WhatsApp, SMS, etc.);
 * otherwise shows WhatsApp, Facebook and "copy link" options.
 */
export function ShareButton({ url, title, text, className }: { url: string; title: string; text: string; className?: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function share() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return; // user closed the sheet
      }
    }
    setOpen((o) => !o);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copied", description: "Paste it anywhere to share this home." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy the link", description: url, variant: "error" });
    }
    setOpen(false);
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={share} className={cn("btn btn-outline", className)} aria-haspopup="menu" aria-expanded={open}>
        <Share2 className="h-4 w-4" /> Share
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-56 animate-fade-in rounded-2xl border border-stone-200 bg-white p-1.5 shadow-lift">
          <a role="menuitem" href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-stone-50" onClick={() => setOpen(false)}>
            <MessageCircle className="h-4 w-4 text-[#25D366]" /> WhatsApp
          </a>
          <a role="menuitem" href={facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-stone-50" onClick={() => setOpen(false)}>
            <FacebookMark /> Facebook
          </a>
          <button role="menuitem" type="button" onClick={copy} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-stone-50">
            {copied ? <Check className="h-4 w-4 text-forest-600" /> : <Copy className="h-4 w-4 text-stone-500" />} Copy link
          </button>
        </div>
      )}
    </div>
  );
}

/** Small Facebook "f" mark (the icon set no longer ships brand logos). */
function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path d="M13.4 19v-6h2l.3-2.4h-2.3V9.1c0-.7.2-1.2 1.2-1.2h1.2V5.8c-.2 0-1-.1-1.8-.1-1.8 0-3 1.1-3 3.1v1.8H9v2.4h2v6h2.4z" fill="#fff" />
    </svg>
  );
}
