"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { memo, Suspense, useState } from "react";
import { BUS_CATALOG, type BusCatalogEntry } from "./content/busCatalog";
import { BusModel, BusPlaceholder } from "./content/BusModel";
import { useGameStore } from "./store";
import { dispatchGameAction } from "./useTabSync";
import { useLocaleStore, useT } from "./i18n";
import { catalogBusPaybackShifts } from "./paybackEconomy";

/**
 * 3B önizleme canvas'ı — ayrı, memo'lu bir bileşen: `useT()`/`useLocaleStore` ÇAĞIRMAZ,
 * bu yüzden dil değişince (TR/EN) bu ağır Three.js sahnesi gereksiz yeniden render olmaz.
 * Sadece `modelId` değişince (araç seçimi) yeniden render edilir.
 */
const BusPreviewCanvas = memo(function BusPreviewCanvas({ modelId }: { modelId: BusCatalogEntry["modelId"] }) {
  return (
    <Canvas frameloop="demand" camera={{ position: [2.6, 1.7, 2.6], fov: 40 }}>
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 5, 2]} intensity={1.1} />
      <Suspense fallback={<BusPlaceholder />}>
        <group position={[0, -0.45, 0]} rotation={[0, Math.PI * 0.25, 0]}>
          <BusModel modelId={modelId} />
        </group>
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableDamping
        minDistance={2.2}
        maxDistance={5}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.58}
        target={[0, 0.25, 0]}
      />
    </Canvas>
  );
});

/**
 * Garaj: katalogdaki dolmuslar + SECILI aracin canli 3B onizlemesi.
 * Bellek icin ayni anda TEK onizleme canvas'i acilir (secili kart),
 * ve frameloop="demand" ile yalnizca gerektiginde render edilir.
 */
export function GaragePanel() {
  const t = useT();
  const activeBusId = useGameStore((s) => s.activeBusId);
  const ownedBusIds = useGameStore((s) => s.ownedBusIds);
  const money = useGameStore((s) => s.money);
  const [previewId, setPreviewId] = useState(activeBusId);

  const previewBus = BUS_CATALOG.find((bus) => bus.id === previewId) ?? BUS_CATALOG[0];
  const currentSeats = BUS_CATALOG.find((bus) => bus.id === activeBusId)?.seats ?? BUS_CATALOG[0].seats;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-white/12 bg-black/25">
        <div className="h-40 w-full">
          <BusPreviewCanvas modelId={previewBus.modelId} />
        </div>
        <div className="border-t border-white/10 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-black text-amber-100">{previewBus.name}</span>
            <span className="text-[11px] font-bold text-white/60">
              {t("garage.stats", { seats: previewBus.seats, speed: previewBus.speedMultiplier })}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-white/55">{previewBus.note}</p>
          <p className="mt-1 text-[10px] font-semibold text-white/40">{t("garage.rotateHint")}</p>
        </div>
      </div>

      <div className="space-y-2">
        {BUS_CATALOG.map((bus) => (
          <BusCard
            key={bus.id}
            bus={bus}
            owned={ownedBusIds.includes(bus.id)}
            active={activeBusId === bus.id}
            affordable={money >= bus.price}
            selected={previewId === bus.id}
            onPreview={() => setPreviewId(bus.id)}
            currentSeats={currentSeats}
          />
        ))}
      </div>
    </div>
  );
}

function BusCard({
  bus,
  owned,
  active,
  affordable,
  selected,
  onPreview,
  currentSeats,
}: {
  bus: BusCatalogEntry;
  owned: boolean;
  active: boolean;
  affordable: boolean;
  selected: boolean;
  onPreview: () => void;
  currentSeats: number;
}) {
  const t = useT();
  const locale = useLocaleStore((state) => state.locale);
  // Faz 2 kural 3: her satın almanın tahmini geri ödeme süresi gösterilir. Bu araçlar
  // sürülen aracın YERİNE geçtiği için amortisman koltuk artışının getirdiği EK gelirden
  // gelir (bkz. paybackEconomy.ts > catalogBusPaybackShifts) — sahip olunmayan, ücretli
  // araçlar için gösterilir.
  const paybackShiftsCount = !owned && bus.price > 0 ? catalogBusPaybackShifts(bus.price, bus.seats, currentSeats) : null;
  return (
    <div
      className={`rounded px-2 py-2 ${
        selected ? "bg-cyan-400/15 ring-1 ring-cyan-300/40" : "bg-black/15"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-bold text-white">{bus.name}</div>
        <span className="text-[11px] font-bold text-white/60">
          {bus.price === 0 ? t("garage.starter") : `₺${bus.price.toLocaleString(locale === "tr" ? "tr-TR" : "en-US")}`}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-bold text-white/55">
        <span className="rounded bg-white/8 px-1.5 py-0.5">{t("garage.seats", { count: bus.seats })}</span>
        <span className="rounded bg-white/8 px-1.5 py-0.5">{t("garage.speed", { value: bus.speedMultiplier })}</span>
      </div>
      {!owned && bus.price > 0 && (
        <div className="mt-1 text-[10px] font-semibold text-emerald-300/90">
          {paybackShiftsCount === null ? t("management.paybackNever") : t("management.paybackShifts", { shifts: paybackShiftsCount })}
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={onPreview}
          className="rounded bg-white/10 px-2 py-1 text-[11px] font-bold text-cyan-100 hover:bg-cyan-400/20"
        >
          {t("garage.preview")}
        </button>
        {active ? (
          <span className="rounded bg-emerald-400/20 px-2 py-1 text-[11px] font-black text-emerald-200">
            {t("garage.active")}
          </span>
        ) : owned ? (
          <button
            type="button"
            onClick={() => dispatchGameAction("setActiveBus", bus.id)}
            className="rounded bg-emerald-400/20 px-2 py-1 text-[11px] font-black text-emerald-200 hover:bg-emerald-400/30"
          >
            {t("garage.use")}
          </button>
        ) : (
          <button
            type="button"
            disabled={!affordable}
            onClick={() => dispatchGameAction("buyCatalogBus", bus.id)}
            className="rounded bg-amber-400/20 px-2 py-1 text-[11px] font-black text-amber-100 hover:bg-amber-400/30 disabled:opacity-40"
          >
            {t("garage.buy")}
          </button>
        )}
      </div>
    </div>
  );
}
