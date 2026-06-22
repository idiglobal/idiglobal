import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
      }}
    >
      <span
        style={{
          color: "white",
          fontWeight: 800,
          fontSize: 72,
          fontFamily: "sans-serif",
          letterSpacing: "-2px",
          lineHeight: 1,
        }}
      >
        IG
      </span>
      <span
        style={{
          color: "rgba(255,255,255,0.75)",
          fontSize: 14,
          fontFamily: "sans-serif",
          fontWeight: 500,
          letterSpacing: "1px",
        }}
      >
        IDENTIKGLOBAL
      </span>
    </div>,
    { ...size }
  )
}
