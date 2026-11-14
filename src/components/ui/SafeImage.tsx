"use client";

import { useState, type ImgHTMLAttributes } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Plain <img> (landlords may paste URLs from any host) with a graceful fallback
 * when the image fails to load.
 */
export function SafeImage({ className, alt, src, ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(!src);

  if (failed) {
    return (
      <div
        className={cn("flex items-center justify-center bg-gradient-to-br from-forest-100 via-sand to-gold-100 text-forest-700/60", className)}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="h-8 w-8" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={className} {...rest} />
  );
}
