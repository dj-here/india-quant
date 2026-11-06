import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const score = searchParams.get("score") || "0";
  const duration = searchParams.get("duration") || "00:00";
  const kills = searchParams.get("kills") || "0";
  const nickname = searchParams.get("nickname") || "Cosmic Survivor";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#070814",
          backgroundImage: "radial-gradient(circle at 50% 50%, #161933 0%, #070814 100%)",
          color: "white",
          fontFamily: "sans-serif",
          padding: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: 4,
            color: "#00f0ff",
            marginBottom: 20,
          }}
        >
          STARFALL SURVIVORS
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: "#ffb703",
            marginBottom: 10,
          }}
        >
          SCORE: {parseInt(score).toLocaleString()}
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#ffffff",
            marginBottom: 30,
          }}
        >
          PILOT: {nickname}
        </div>
        <div
          style={{
            display: "flex",
            gap: 40,
            fontSize: 24,
            color: "#9d4edd",
          }}
        >
          <div>TIME: {duration}</div>
          <div>ENEMIES CRUSHED: {kills}</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
