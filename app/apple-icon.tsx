import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A0A09",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 140,
          fontWeight: 900,
          color: "#D7FF1E",
          letterSpacing: -6,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        X
      </div>
    ),
    { ...size }
  );
}
