"use client";

import { useEffect, useMemo, useRef, useState, type SVGProps } from "react";
import { RadioIcon, XIcon } from "./GameIcon";
import { useT } from "./i18n";
import { RADIO_PREFERENCES_KEY, useRadioStore } from "./radioStore";

interface RadioStation {
  id: string;
  name: string;
  streamUrl: string;
  homepage: string;
  favicon: string;
  tags: string[];
  country: string;
  language: string;
  codec: string;
  bitrate: number;
}

const FALLBACK_STATION: RadioStation = {
  id: "electrohug-pop",
  name: "ElectroHug Pop",
  streamUrl: "https://cast1.asurahosting.com/proxy/michelep/stream",
  homepage: "https://pop.electrohug.net/",
  favicon: "",
  tags: ["indie", "pop"],
  country: "International",
  language: "English",
  codec: "MP3",
  bitrate: 192,
};

export function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const panelOpen = useRadioStore((state) => state.panelOpen);
  const status = useRadioStore((state) => state.status);
  const volume = useRadioStore((state) => state.volume);
  const muted = useRadioStore((state) => state.muted);
  const selectedStationId = useRadioStore((state) => state.selectedStationId);
  const closePanel = useRadioStore((state) => state.closePanel);
  const setStatus = useRadioStore((state) => state.setStatus);
  const setVolume = useRadioStore((state) => state.setVolume);
  const toggleMuted = useRadioStore((state) => state.toggleMuted);
  const selectStation = useRadioStore((state) => state.selectStation);
  const [stations, setStations] = useState<RadioStation[]>([FALLBACK_STATION]);
  const [directoryError, setDirectoryError] = useState(false);
  const t = useT();

  const selectedStation = useMemo(
    () => stations.find((station) => station.id === selectedStationId) ?? stations[0] ?? FALLBACK_STATION,
    [selectedStationId, stations],
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(RADIO_PREFERENCES_KEY, JSON.stringify({ volume, muted, selectedStationId }));
    } catch {
      // Storage availability must not interrupt playback.
    }
  }, [muted, selectedStationId, volume]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [muted, volume]);

  useEffect(() => {
    if (!panelOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePanel, panelOpen]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/radio/stations", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Directory unavailable");
        return response.json() as Promise<{ stations: RadioStation[] }>;
      })
      .then((payload) => {
        setStations([...payload.stations, FALLBACK_STATION]);
        setDirectoryError(false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStations([FALLBACK_STATION]);
        setDirectoryError(true);
      });
    return () => controller.abort();
  }, []);

  async function play() {
    const audio = audioRef.current;
    if (!audio) return;
    setStatus("loading");
    audio.volume = muted ? 0 : volume;
    try {
      await audio.play();
    } catch {
      setStatus("error");
    }
  }

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (status === "playing" || status === "loading") {
      audio.pause();
      setStatus("paused");
      return;
    }
    await play();
  }

  async function changeStation(station: RadioStation) {
    const wasActive = status === "playing" || status === "loading";
    selectStation(station.id);
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = station.streamUrl;
    audio.load();
    setStatus("idle");
    if (wasActive) await play();
  }

  const isPlaying = status === "playing";
  const isLoading = status === "loading";

  return (
    <>
      <audio
        ref={audioRef}
        src={selectedStation.streamUrl}
        preload="none"
        onPlaying={() => setStatus("playing")}
        onWaiting={() => setStatus("loading")}
        onPause={() => { if (useRadioStore.getState().status !== "error") setStatus("paused"); }}
        onError={() => setStatus("error")}
      />

      {panelOpen && (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label={t("radio.close")} onClick={closePanel} />
          <section className="ff-radio-panel pointer-events-auto fixed right-3 top-[124px] z-50 w-[min(32rem,calc(100vw-1.5rem))] overflow-hidden sm:right-4 sm:top-[90px]" role="dialog" aria-label={t("radio.title")}>
            <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ff-ink text-ff-paper"><RadioIcon className="h-4 w-4" /></span>
                <div className="min-w-0"><p className="ff-stop-kicker">{t("radio.live")}</p><h2 className="ff-display truncate text-lg">{selectedStation.name}</h2></div>
              </div>
              <button type="button" onClick={closePanel} className="ff-button ff-button-ghost h-9 min-h-9 w-9 p-0" aria-label={t("radio.close")}><XIcon className="h-4 w-4" /></button>
            </header>

            <div className="grid gap-3 p-3 sm:grid-cols-[1fr_1.1fr]">
              <section className="rounded-xl border border-ff-ink/10 bg-white/45 p-3">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={togglePlayback} className="group grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ff-ink text-ff-paper" aria-label={isPlaying ? t("radio.pause") : t("radio.play")}>
                    {isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" /> : isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="ml-0.5 h-6 w-6" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{selectedStation.name}</p>
                    <p className="mt-0.5 truncate text-[10px] text-ff-muted">{selectedStation.language} · {selectedStation.codec}{selectedStation.bitrate > 0 ? ` · ${selectedStation.bitrate} kbps` : ""}</p>
                    <Equalizer active={isPlaying} />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">{selectedStation.tags.map((tag) => <span key={tag} className="rounded-md bg-ff-ink/6 px-2 py-1 text-[9px] font-bold text-ff-muted">{tag}</span>)}</div>
                <div className="mt-3 flex items-center gap-2">
                  <button type="button" onClick={toggleMuted} className="ff-button ff-button-ghost h-9 min-h-9 w-9 p-0" aria-label={muted ? t("radio.unmute") : t("radio.mute")}>{muted || volume === 0 ? <MutedIcon className="h-4 w-4" /> : <VolumeIcon className="h-4 w-4" />}</button>
                  <input type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume} onChange={(event) => setVolume(Number(event.target.value))} className="ff-settings-range min-w-0 flex-1" aria-label={t("radio.volume")} />
                  <span className="w-8 text-right text-[10px] font-bold">{Math.round((muted ? 0 : volume) * 100)}</span>
                </div>
                {status === "error" && <button type="button" onClick={play} className="ff-button mt-3 w-full text-xs">{t("radio.retry")}</button>}
              </section>

              <section className="min-h-0">
                <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold">{t("radio.channels")}</h3><span className="text-[9px] text-ff-muted">{stations.length}</span></div>
                <div className="ff-scroll max-h-64 space-y-1 overflow-y-auto pr-1">
                  {stations.map((station) => (
                    <button key={station.id} type="button" data-active={station.id === selectedStation.id} onClick={() => void changeStation(station)} className="ff-radio-station flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-ff-ink/6"><RadioIcon className="h-3.5 w-3.5" /></span>
                      <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{station.name}</strong><small className="block truncate text-[9px] text-ff-muted">{station.language} · {station.tags[0] ?? station.country}</small></span>
                      {station.id === selectedStation.id && <Equalizer active={isPlaying} />}
                    </button>
                  ))}
                </div>
                {directoryError && <p className="mt-2 text-[10px] text-ff-muted">{t("radio.directoryFallback")}</p>}
              </section>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function Equalizer({ active }: { active: boolean }) {
  return <span className="mt-2 flex h-4 items-end gap-0.5" aria-hidden="true">{[45, 82, 62, 100, 56].map((height, index) => <span key={`${height}-${index}`} className={`ff-radio-eq-bar w-0.5 rounded-full bg-ff-ink ${active ? "" : "!h-0.5 !animate-none opacity-25"}`} style={{ height: `${height}%`, animationDelay: `${index * 90}ms` }} />)}</span>;
}

function PlayIcon(props: SVGProps<SVGSVGElement>) { return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}><path d="M7.5 4.8a1 1 0 0 1 1.52-.85l11 7.2a1 1 0 0 1 0 1.7l-11 7.2a1 1 0 0 1-1.52-.84V4.8Z" /></svg>; }
function PauseIcon(props: SVGProps<SVGSVGElement>) { return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}><rect x="6" y="4" width="4.5" height="16" rx="1.4" /><rect x="13.5" y="4" width="4.5" height="16" rx="1.4" /></svg>; }
function VolumeIcon(props: SVGProps<SVGSVGElement>) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="M5 9v6h4l5 4V5L9 9H5Z" /><path d="M17 8.5a5 5 0 0 1 0 7" /></svg>; }
function MutedIcon(props: SVGProps<SVGSVGElement>) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="M5 9v6h4l5 4V5L9 9H5Z" /><path d="m17 10 4 4" /><path d="m21 10-4 4" /></svg>; }
