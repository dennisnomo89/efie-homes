"use client";

import { useState, type ImgHTMLAttributes } from "react";
import { ImageOff } from "lucide-react";
import { responsiveSrc } from "@/lib/images";
import { cn } from "@/lib/utils";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  /** Above-the-fold / main image: load immediately with high priority instead of lazily. */
  priority?: boolean;
};

/**
 * Plain <img> (landlords may paste URLs from any host) with a graceful fallback when the image fails.
 * For image hosts that can resize on request (Unsplash), it adds a srcset so phones download a small
 * version; pass `sizes` to describe how wide the image is shown.
 */
export function SafeImage({ className, alt, src, priority = false, sizes, ...rest }: Props) {
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

  const responsive = typeof src === "string" ? responsiveSrc(src) : null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={responsive?.src ?? src}
      srcSet={responsive?.srcSet}
      sizes={responsive ? (sizes ?? "100vw") : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
}
