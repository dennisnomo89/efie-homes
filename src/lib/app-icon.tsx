import { ImageResponse } from "next/og";

/**
 * The Efie Homes mark as a PNG at any size. `padding` (0–0.4) shrinks the mark inside a full-bleed
 * background, which "maskable" Android icons need so the logo survives circle/squircle cropping.
 */
export function appIcon(size: number, { padding = 0, rounded = true }: { padding?: number; rounded?: boolean } = {}) {
  const inner = Math.round(size * (1 - padding * 2));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#174e3c", borderRadius: rounded && padding === 0 ? size * 0.22 : 0 }}>
        <svg width={inner} height={inner} viewBox="0 0 32 32">
          <path d="M6 15.2 16 7.2l10 8" stroke="#f2c14e" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M9.3 14v11h13.4V14" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" fill="none" />
          <path d="M13.8 25v-5.2h4.4V25" stroke="#e2805c" strokeWidth="2.4" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
