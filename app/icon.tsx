import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 56,
          fontWeight: 900,
          color: "#D7FF1E",
          letterSpacing: -2,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        X
      </div>
    ),
    { ...size }
  );
}
