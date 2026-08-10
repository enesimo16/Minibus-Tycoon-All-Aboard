import { NextResponse } from "next/server";

const NOW_PLAYING_URL =
  "https://cast1.asurahosting.com:2199/rpc/michelep/streaminfo.get";

type StreamInfo = {
  title?: string;
  rawmeta?: string;
  bitrate?: string;
  listeners?: number | string;
  offline?: boolean;
  serverstate?: boolean;
  track?: {
    artist?: string;
    title?: string;
    album?: string;
  };
};

type StreamInfoResponse = {
  data?: StreamInfo[];
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(NOW_PLAYING_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(6_000),
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Radio metadata request failed with ${response.status}`);
    }

    const payload = (await response.json()) as StreamInfoResponse;
    const stream = payload.data?.[0];

    if (!stream) {
      throw new Error("Radio metadata was empty");
    }

    const rawMetadata = stream.rawmeta?.trim() ?? "";
    const licenseMatch = rawMetadata.match(
      /\s+-\s+((?:CC(?:0)?|Public Domain)[^(]+?)\s*\((https?:\/\/[^)]+)\)\s*$/i,
    );
    const trackLinkMatch = rawMetadata.match(
      /\s+-\s+(https?:\/\/\S+)\s+-\s+(?:CC(?:0)?|Public Domain)/i,
    );

    return NextResponse.json(
      {
        station: stream.title?.trim() || "ElectroHug Pop",
        artist: stream.track?.artist?.trim() || "Bağımsız sanatçı",
        title:
          stream.track?.album?.trim() ||
          stream.track?.title?.trim() ||
          "Canlı yayın",
        license: licenseMatch?.[1]?.trim() || "Creative Commons",
        licenseUrl: licenseMatch?.[2] || "https://creativecommons.org/",
        trackUrl: trackLinkMatch?.[1] || "https://pop.electrohug.net/",
        bitrate: stream.bitrate?.trim() || "192 Kbps",
        listeners: Number(stream.listeners) || 0,
        live: stream.serverstate !== false && stream.offline !== true,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        error: "Canlı yayın bilgisi alınamadı.",
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}
