import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0px",
      }}
    >
      <span
        style={{
          color: "white",
          fontWeight: 700,
          fontSize: 88,
          fontFamily: "Arial, sans-serif",
          letterSpacing: "-3px",
          lineHeight: 1,
          marginBottom: "6px",
        }}
      >
        IG
      </span>
      <div
        style={{
          width: 70,
          height: 4,
          background: "#0d9488",
          borderRadius: 2,
        }}
      />
    </div>,
    { ...size }
  )
}
