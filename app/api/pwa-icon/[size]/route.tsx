import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ size: string }> }
) {
  const { size: sizeStr } = await ctx.params;
  const size = Math.max(72, Math.min(1024, parseInt(sizeStr, 10) || 192));
  const fontSize = Math.round(size * 0.78);

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
          fontSize,
          fontWeight: 900,
          color: "#D7FF1E",
          letterSpacing: -Math.round(size * 0.05),
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        X
      </div>
    ),
    { width: size, height: size }
  );
}
