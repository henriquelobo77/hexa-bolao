import { ImageResponse } from "next/og";

export const alt = "HEXA · Bolão Copa 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A0A09",
          display: "flex",
          flexDirection: "column",
          padding: "70px 80px",
          justifyContent: "space-between",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "rgba(242, 241, 236, 0.55)",
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#D7FF1E",
            }}
          />
          Bolão · Copa 2026
        </div>

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontSize: 380,
            fontWeight: 900,
            color: "#F2F1EC",
            letterSpacing: -16,
            lineHeight: 0.85,
          }}
        >
          HE<span style={{ color: "#D7FF1E" }}>X</span>A
        </div>

        {/* Bottom tag */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            color: "rgba(242, 241, 236, 0.55)",
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          <div>Acertou? Subiu no ranking.</div>
          <div style={{ color: "#D7FF1E", fontWeight: 700 }}>
            11 jun · 19 jul
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
