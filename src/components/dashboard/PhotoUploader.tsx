"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "../ui/Toast";

const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.82;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/**
 * Shrinks a photo in the browser (longest side 1600px, JPEG) so uploads are quick on mobile data
 * and stay under the server's size limit. Falls back to the original file if it's already small.
 */
async function shrink(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`"${file.name}" isn't a photo this browser can read. Use a JPEG, PNG or WebP image.`);
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't process this photo.");
  ctx.fillStyle = "#ffffff"; // transparent PNGs get a white background as JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  if (!blob) throw new Error("Your browser couldn't process this photo.");
  const originalOk = scale === 1 && file.size <= blob.size && /^image\/(jpeg|png|webp)$/.test(file.type);
  return originalOk ? file : blob;
}

export function PhotoUploader({ remaining, onUploaded }: { remaining: number; onUploaded: (url: string) => void }) {
  const { toast } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function handle(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files).slice(0, Math.max(0, remaining));
    if (list.length < files.length) {
      toast({ title: "Photo limit reached", description: "A listing can have up to 12 photos.", variant: "info" });
    }
    if (list.length === 0) return;

    setProgress({ done: 0, total: list.length });
    let ok = 0;
    for (const [i, file] of list.entries()) {
      try {
        const blob = await shrink(file);
        if (blob.size > MAX_UPLOAD_BYTES) throw new Error(`"${file.name}" is too large even after resizing.`);
        const body = new FormData();
        body.append("file", blob, file.name.replace(/\.[^.]+$/, "") + (blob === file ? "" : ".jpg"));
        const res = await fetch("/api/uploads", { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Upload failed.");
        onUploaded(data.url);
        ok++;
      } catch (err) {
        toast({ title: "A photo wasn't uploaded", description: err instanceof Error ? err.message : "Please try again.", variant: "error" });
      }
      setProgress({ done: i + 1, total: list.length });
    }
    setProgress(null);
    if (input.current) input.current.value = "";
    if (ok > 0) toast({ title: ok === 1 ? "Photo added" : `${ok} photos added`, description: "Use the arrows to reorder them; the first photo is the cover." });
  }

  const busy = progress !== null;
  return (
    <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-sand/40 p-4 text-center">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        id="photo-upload"
        onChange={(e) => handle(e.target.files)}
        disabled={busy || remaining <= 0}
      />
      <label
        htmlFor="photo-upload"
        className={`btn btn-primary cursor-pointer ${busy || remaining <= 0 ? "pointer-events-none opacity-60" : ""}`}
        aria-disabled={busy || remaining <= 0}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        {busy ? `Uploading ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…` : "Upload photos"}
      </label>
      <p className="mt-2 text-xs text-stone-500">
        {remaining > 0 ? `JPEG, PNG or WebP. Up to ${remaining} more ${remaining === 1 ? "photo" : "photos"}; we resize them for you.` : "You've added the maximum of 12 photos."}
      </p>
    </div>
  );
}
