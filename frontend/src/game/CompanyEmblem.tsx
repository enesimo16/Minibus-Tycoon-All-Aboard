"use client";

// Şirket amblemleri — dört seçeneğin her biri kendi şeklini çizer ve oyuncunun
// seçtiği iki renkle boyanır. Eskiden sadece amblem ADI yazıyordu, bu yüzden
// seçim yapmak hiçbir görsel karşılık üretmiyordu.
// Amblem kimlikleri backend `Emblems` listesiyle birebir aynı olmalı
// (bkz. Services/ProgressionEndpoints.cs).

export type EmblemId = "route" | "wheel" | "city" | "star";

export function CompanyEmblem({
  emblemId,
  primary,
  secondary,
  className = "",
}: {
  emblemId: EmblemId | string;
  primary: string;
  secondary: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-hidden="true">
      {/* Zemin: ana renk. Şekil ikincil renkle çizilir — rozetteki kontrast buradan gelir. */}
      <rect x="0" y="0" width="48" height="48" rx="12" fill={primary} />
      <g stroke={secondary} fill="none" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        {emblemId === "route" && (
          <>
            {/* Zikzak güzergâh + iki durak noktası */}
            <path d="M11 35 L20 24 L28 30 L37 14" />
            <circle cx="11" cy="35" r="3.1" fill={secondary} stroke="none" />
            <circle cx="37" cy="14" r="3.1" fill={secondary} stroke="none" />
          </>
        )}
        {emblemId === "wheel" && (
          <>
            {/* Direksiyon */}
            <circle cx="24" cy="24" r="12" />
            <circle cx="24" cy="24" r="3.4" fill={secondary} stroke="none" />
            <path d="M24 12 L24 20.6" />
            <path d="M13.6 30 L21 25.7" />
            <path d="M34.4 30 L27 25.7" />
          </>
        )}
        {emblemId === "city" && (
          <>
            {/* Üç bina silueti */}
            <path d="M10 36 L10 22 L18 22 L18 36" />
            <path d="M20 36 L20 14 L28 14 L28 36" />
            <path d="M30 36 L30 26 L38 26 L38 36" />
            <path d="M8 36 L40 36" />
          </>
        )}
        {emblemId === "star" && (
          <path d="M24 11 L28.2 20.2 L38 21.4 L30.8 28.2 L32.7 38 L24 33.2 L15.3 38 L17.2 28.2 L10 21.4 L19.8 20.2 Z" />
        )}
      </g>
    </svg>
  );
}
