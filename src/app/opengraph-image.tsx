import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded share preview used for pages without their own photo. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#134033", color: "white" }}>
        <div style={{ display: "flex", height: 18 }}>
          {["#e3a92b", "#174e3c", "#d9633d", "#1c1917", "#e3a92b", "#174e3c", "#d9633d", "#1c1917"].map((c, i) => (
            <div key={i} style={{ flex: 1, background: c }} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, padding: "0 90px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 24,
                background: "#174e3c",
                border: "4px solid #f2c14e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 56,
              }}
            >
              ⌂
            </div>
            <div style={{ display: "flex", fontSize: 72, fontWeight: 700 }}>
              Efie<span style={{ color: "#e2805c", marginLeft: 18 }}>Homes</span>
            </div>
          </div>
          <div style={{ display: "flex", marginTop: 40, fontSize: 52, fontWeight: 700, lineHeight: 1.15 }}>{SITE_TAGLINE}</div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 30, color: "#b4e5cb" }}>
            Prices in cedis · Advance shown upfront · Verified landlords
          </div>
        </div>
      </div>
    ),
    size,
  );
}
