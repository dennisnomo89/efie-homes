"use client";

/**
 * Last-resort error screen, used only if the root layout itself fails. It replaces the whole page,
 * so it can't rely on the site's fonts or Tailwind; styles are inline.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-GH">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#faf7f2", fontFamily: "system-ui, sans-serif", color: "#1c1917" }}>
        <div style={{ maxWidth: 420, padding: 32, textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#174e3c", margin: 0 }}>
            Efie <span style={{ color: "#b8442a" }}>Homes</span>
          </p>
          <h1 style={{ fontSize: 24, margin: "16px 0 8px" }}>We&rsquo;ll be right back</h1>
          <p style={{ color: "#57534e", lineHeight: 1.5 }}>Efie Homes is having trouble loading. Please try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 20, padding: "12px 20px", borderRadius: 12, border: 0, background: "#174e3c", color: "#fff", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
