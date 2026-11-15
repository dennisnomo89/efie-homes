"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { SafeImage } from "./ui/SafeImage";
import { Portal } from "./ui/Portal";
import { useDialogFocus } from "./ui/useDialogFocus";
import { cn } from "@/lib/utils";

export function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  useDialogFocus(lightbox, viewerRef);
  const count = images.length;

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, go]);

  if (count === 0) {
    return <SafeImage alt={title} className="aspect-[16/9] w-full rounded-3xl" />;
  }

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
        <div className="relative overflow-hidden rounded-3xl sm:col-span-3 sm:row-span-2 sm:rounded-r-none">
          <button onClick={() => setLightbox(true)} className="block w-full" aria-label="Open photo viewer">
            <SafeImage priority sizes="(min-width: 1280px) 960px, (min-width: 640px) 75vw, 100vw" src={images[index]} alt={`${title} — photo ${index + 1}`} className="aspect-[4/3] w-full object-cover sm:aspect-[16/10]" />
          </button>
          {count > 1 && (
            <>
              <NavButton side="left" onClick={() => go(-1)} />
              <NavButton side="right" onClick={() => go(1)} />
            </>
          )}
          <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            <Expand className="h-3.5 w-3.5" /> {index + 1} / {count}
          </span>
        </div>
        {images.slice(1, 3).map((src, i) => (
          <button
            key={src + i}
            onClick={() => setIndex(i + 1)}
            className={cn(
              "relative hidden overflow-hidden sm:block",
              i === 0 ? "rounded-tr-3xl" : "rounded-br-3xl",
              index === i + 1 && "ring-4 ring-inset ring-gold-400",
            )}
            aria-label={`Show photo ${i + 2}`}
          >
            <SafeImage src={src} alt="" sizes="(min-width: 1280px) 320px, 25vw" className="h-full w-full object-cover transition hover:scale-105" />
            {i === 1 && count > 3 && (
              <span className="absolute inset-0 flex items-center justify-center bg-ink/50 text-lg font-semibold text-white">+{count - 3} photos</span>
            )}
          </button>
        ))}
      </div>

      {/* Thumbnails on mobile */}
      {count > 1 && (
        <div className="scrollbar-none mt-2 flex gap-2 overflow-x-auto sm:hidden">
          {images.map((src, i) => (
            <button key={src + i} onClick={() => setIndex(i)} className={cn("h-16 w-20 shrink-0 overflow-hidden rounded-xl", i === index && "ring-2 ring-forest-700")} aria-label={`Show photo ${i + 1}`}>
              <SafeImage src={src} alt="" sizes="80px" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <Portal>
        <div ref={viewerRef} className="fixed inset-0 z-[60] flex animate-fade-in items-center justify-center bg-ink/95 p-4" role="dialog" aria-modal="true" aria-label="Photo viewer">
          <button onClick={() => setLightbox(false)} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close">
            <X className="h-6 w-6" />
          </button>
          <SafeImage sizes="100vw" src={images[index]} alt={`${title} — photo ${index + 1}`} className="max-h-[85vh] max-w-full rounded-2xl object-contain" />
          {count > 1 && (
            <>
              <NavButton side="left" onClick={() => go(-1)} large />
              <NavButton side="right" onClick={() => go(1)} large />
            </>
          )}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
            {index + 1} / {count}
          </p>
        </div>
        </Portal>
      )}
    </>
  );
}

function NavButton({ side, onClick, large }: { side: "left" | "right"; onClick: () => void; large?: boolean }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition hover:bg-white",
        large ? "h-12 w-12" : "h-10 w-10",
        side === "left" ? "left-3" : "right-3",
      )}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
