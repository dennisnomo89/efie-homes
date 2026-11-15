"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { Portal } from "../ui/Portal";
import { useDialogFocus } from "../ui/useDialogFocus";
import { useToast } from "../ui/Toast";
import { MESSAGE_MAX_LENGTH } from "@/lib/validations";
import { cn } from "@/lib/utils";

type Msg = { id: string; body: string; createdAt: string; readAt: string | null; mine: boolean; from: "tenant" | "landlord" };
type Thread = {
  canPost: boolean;
  viewing: { propertyTitle: string; tenantName: string; landlordName: string };
  messages: Msg[];
};

type Props = {
  viewingId: string;
  /** Name of the other person, for the button and header */
  withName: string;
  unread?: number;
  total?: number;
  autoOpen?: boolean;
};

const POLL_MS = 10_000;

function timeLabel(iso: string) {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }).replace(" ", "").toLowerCase();
  return sameDay ? time : `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${time}`;
}

export function MessageThread({ viewingId, withName, unread = 0, total = 0, autoOpen = false }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(autoOpen);
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const dirty = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocus(open, panelRef, "textarea");
  // Once the thread has been opened, its messages are read, so stop showing the badge.
  const [seen, setSeen] = useState(false);
  const badge = seen ? 0 : unread;

  const load = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setLoading(true);
      const res = await fetch(`/api/viewings/${viewingId}/messages`, { cache: "no-store" });
      if (showSpinner) setLoading(false);
      if (!res.ok) {
        if (showSpinner) toast({ title: "Couldn't load messages", description: "Please try again.", variant: "error" });
        return;
      }
      setThread(await res.json());
      dirty.current = true; // opening marks messages read, so badges need refreshing later
      setSeen(true);
    },
    [viewingId, toast],
  );

  const close = useCallback(() => {
    setOpen(false);
    if (dirty.current) {
      dirty.current = false;
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    if (!open) return;
    load(true);
    const timer = setInterval(() => load(false), POLL_MS);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearInterval(timer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, load, close]);

  // Keep the newest message in view.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [thread?.messages.length]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    const res = await fetch(`/api/viewings/${viewingId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      toast({ title: "Message not sent", description: data.errors?.body ?? data.error ?? "Please try again.", variant: "error" });
      return;
    }
    setDraft("");
    setThread((t) => (t ? { ...t, messages: [...t.messages, { ...data.message, createdAt: String(data.message.createdAt) }] } : t));
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-sm btn-outline relative" aria-label={`Messages with ${withName}${badge ? `, ${badge} unread` : ""}`}>
        <MessageCircle className="h-4 w-4" />
        Messages{total > 0 ? ` (${total})` : ""}
        {badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-terracotta-600 px-1.5 text-[11px] font-bold text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <Portal>
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby={`thread-${viewingId}`}>
            <div className="absolute inset-0 animate-fade-in bg-ink/50 backdrop-blur-sm" onClick={close} />
            <div ref={panelRef} className="relative flex h-[85vh] w-full max-w-lg animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[640px] sm:rounded-3xl">
              <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
                <div className="min-w-0">
                  <h2 id={`thread-${viewingId}`} className="truncate font-semibold">
                    {withName}
                  </h2>
                  <p className="truncate text-xs text-stone-500">{thread?.viewing.propertyTitle ?? "Loading…"}</p>
                </div>
                <button onClick={close} className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl hover:bg-stone-100" aria-label="Close messages">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto bg-sand/40 px-4 py-4" aria-live="polite">
                {loading && !thread ? (
                  <div className="flex h-full items-center justify-center text-stone-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : thread && thread.messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-stone-500">
                    <MessageCircle className="mb-2 h-8 w-8 text-stone-300" />
                    No messages yet. Ask about the viewing, directions or anything else about the home.
                  </div>
                ) : (
                  thread?.messages.map((m) => (
                    <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                          m.mine ? "rounded-br-md bg-forest-800 text-white" : "rounded-bl-md bg-white text-ink ring-1 ring-stone-200",
                        )}
                      >
                        {!m.mine && thread.canPost === false && (
                          <p className="mb-0.5 text-[11px] font-semibold text-stone-500">
                            {m.from === "tenant" ? thread.viewing.tenantName : thread.viewing.landlordName}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={cn("mt-1 text-right text-[11px]", m.mine ? "text-forest-200" : "text-stone-400")}>
                          {timeLabel(m.createdAt)}
                          {m.mine && (m.readAt ? " · Read" : " · Sent")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {thread?.canPost === false ? (
                <p className="border-t border-stone-100 px-5 py-4 text-center text-xs text-stone-500">Admins can read this conversation but not reply.</p>
              ) : (
                <form onSubmit={send} className="flex items-end gap-2 border-t border-stone-100 p-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    maxLength={MESSAGE_MAX_LENGTH}
                    placeholder={`Message ${withName.split(" ")[0]}…`}
                    className="input max-h-32 min-h-[44px] flex-1 resize-none"
                    aria-label="Message"
                  />
                  <button type="submit" disabled={sending || !draft.trim()} className="btn btn-primary h-11 w-11 shrink-0 px-0" aria-label="Send message">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              )}
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
