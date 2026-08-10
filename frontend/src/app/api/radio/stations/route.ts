import { NextResponse } from "next/server";

const DIRECTORY_URL =
  "https://de1.api.radio-browser.info/json/stations/search?countrycode=TR&hidebroken=true&order=clickcount&reverse=true&limit=40";

interface RadioBrowserStation {
  stationuuid?: string;
  name?: string;
  url_resolved?: string;
  homepage?: string;
  favicon?: string;
  tags?: string;
  country?: string;
  language?: string;
  codec?: string;
  bitrate?: number;
  lastcheckok?: number;
}

export const dynamic = "force-dynamic";

function normalizeDirectoryText(value: string | undefined, fallback = "") {
  const text = value?.trim() || fallback;
  if (!/[ÃÂÄÅ]/.test(text)) return text;
  const decoded = Buffer.from(text, "latin1").toString("utf8");
  return decoded.includes("�") ? text : decoded;
}

export async function GET() {
  try {
    const response = await fetch(DIRECTORY_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
      headers: { "User-Agent": "MinibusTycoon/1.0", Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Radio directory failed: ${response.status}`);

    const payload = (await response.json()) as RadioBrowserStation[];
    const stations = payload
      .filter((station) => station.stationuuid && station.name && station.url_resolved && station.lastcheckok !== 0)
      .filter((station) => station.url_resolved!.startsWith("https://"))
      .filter((station) => /^(MP3|AAC|AAC\+)$/i.test(station.codec ?? "MP3"))
      .slice(0, 18)
      .map((station) => ({
        id: station.stationuuid!,
        name: normalizeDirectoryText(station.name),
        streamUrl: station.url_resolved!,
        homepage: station.homepage?.trim() ?? "",
        favicon: station.favicon?.trim() ?? "",
        tags: station.tags?.split(",").map((tag) => normalizeDirectoryText(tag)).filter(Boolean).slice(0, 3) ?? [],
        country: normalizeDirectoryText(station.country, "Türkiye"),
        language: normalizeDirectoryText(station.language, "Türkçe"),
        codec: station.codec?.trim() || "MP3",
        bitrate: Math.max(0, station.bitrate ?? 0),
      }));

    if (stations.length === 0) throw new Error("No compatible Turkish stations");
    return NextResponse.json({ stations }, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=900" } });
  } catch {
    return NextResponse.json({ error: "Radyo istasyonları şu anda alınamıyor." }, { status: 502 });
  }
}
