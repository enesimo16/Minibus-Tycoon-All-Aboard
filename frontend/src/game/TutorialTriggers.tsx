"use client";

import { useEffect } from "react";
import { useGameStore } from "./store";
import { useProgressionStore } from "./progressionStore";
import { useUiStore } from "./uiStore";
import { ECONOMY } from "./economy";
import { useTutorialStore } from "./tutorialStore";
import { TUTORIAL_PACKAGES } from "./TutorialOverlay";

// Faz 8 — bağlama göre açılan tutorial paketleri. Her paket TAM OLARAK BİR KEZ, ilgili gerçek
// oyun durumu ilk kez gerçekleştiğinde teklif edilir (bkz. faz-plani.md). "core" bitmeden veya
// başka bir paket açıkken hiçbir tetikleyici araya girmez (tutorialStore.activatePackage no-op).
export function TutorialTriggers() {
  const activatePackage = useTutorialStore((s) => s.activatePackage);

  const money = useGameStore((s) => s.money);
  const activeContractCount = useGameStore((s) => s.activeContracts.length);
  const ownedBusCount = useGameStore((s) => s.ownedBusIds.length);
  const cityEventSeen = useGameStore((s) => s.cityEvent !== null);
  const chanceOpen = useUiStore((s) => s.chanceGamesOpen);
  const level = useProgressionStore((s) => s.bootstrap?.progression.level ?? 1);

  useEffect(() => {
    if (money >= (ECONOMY.upgrades.motorCosts as number[])[0]) {
      activatePackage("upgrade", TUTORIAL_PACKAGES.upgrade.length);
    }
  }, [money, activatePackage]);

  useEffect(() => {
    if (level >= 3) activatePackage("driver", TUTORIAL_PACKAGES.driver.length);
    if (level >= 10) activatePackage("newRoute", TUTORIAL_PACKAGES.newRoute.length);
  }, [level, activatePackage]);

  useEffect(() => {
    if (activeContractCount > 0) activatePackage("contract", TUTORIAL_PACKAGES.contract.length);
  }, [activeContractCount, activatePackage]);

  useEffect(() => {
    if (ownedBusCount > 1) activatePackage("secondBus", TUTORIAL_PACKAGES.secondBus.length);
  }, [ownedBusCount, activatePackage]);

  useEffect(() => {
    if (cityEventSeen) activatePackage("cityEvent", TUTORIAL_PACKAGES.cityEvent.length);
  }, [cityEventSeen, activatePackage]);

  useEffect(() => {
    if (chanceOpen) activatePackage("chance", TUTORIAL_PACKAGES.chance.length);
  }, [chanceOpen, activatePackage]);

  return null;
}
