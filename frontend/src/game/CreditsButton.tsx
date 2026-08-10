"use client";

import { useState } from "react";

// CC-BY şartı: üçüncü parti varlıklar oyun içinde görünür şekilde atıflandırılmalı
// (bkz. CREDITS.md). Görsel bir iş değil, metin/uyumluluk işi — Kemal'in listesinde değil.
const CREDITS = [
  {
    name: "Simple Cartoon City Mega Pack",
    author: "mertkilic",
    url: "https://sketchfab.com/3d-models/simple-cartoon-city-mega-pack-free-download-8d5e54ad61a34fd9b36958e56904ca49",
    license: "CC Attribution (CC-BY)",
  },
];

export function CreditsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="pointer-events-auto absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white/80 hover:bg-black/70 hover:text-white"
      >
        ⓘ Krediler
      </button>

      {open && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="w-80 rounded-xl bg-zinc-900 p-4 text-white shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Krediler</h2>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
                ✕
              </button>
            </div>
            <ul className="space-y-3 text-sm">
              {CREDITS.map((c) => (
                <li key={c.url}>
                  <a href={c.url} target="_blank" rel="noreferrer" className="text-amber-400 underline">
                    {c.name}
                  </a>
                  <div className="text-white/60">
                    {c.author} — {c.license}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
