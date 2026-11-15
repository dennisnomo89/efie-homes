/** Widths offered to the browser; it picks one based on `sizes` and the screen's pixel density. */
const WIDTHS = [400, 640, 960, 1280, 1600];

/**
 * For hosts that resize images from URL parameters (Unsplash), returns a srcset of sizes.
 * Returns null for other hosts, which are shown as-is.
 */
export function responsiveSrc(src: string): { src: string; srcSet: string } | null {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return null;
  }
  if (url.hostname !== "images.unsplash.com") return null;

  const at = (w: number) => {
    const u = new URL(url);
    u.searchParams.set("w", String(w));
    u.searchParams.set("auto", "format"); // WebP/AVIF where supported
    if (!u.searchParams.has("q")) u.searchParams.set("q", "70");
    return u.toString();
  };
  return { src: at(960), srcSet: WIDTHS.map((w) => `${at(w)} ${w}w`).join(", ") };
}
