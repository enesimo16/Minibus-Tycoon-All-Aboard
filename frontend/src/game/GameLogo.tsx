"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useUiStore } from "./uiStore";

const LOGO_IDLE_DELAY_MS = 2_800;

export function GameLogo() {
  const stripMode = useUiStore((state) => state.stripMode);
  const [active, setActive] = useState(true);
  const idleTimer = useRef<number | null>(null);

  useEffect(() => {
    const scheduleIdle = () => {
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setActive(false), LOGO_IDLE_DELAY_MS);
    };
    const handleActivity = () => {
      setActive(true);
      scheduleIdle();
    };

    scheduleIdle();
    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("mousedown", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity, { passive: true });
    return () => {
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, []);

  if (stripMode) return null;

  return (
    <div className="ff-game-logo" data-active={active} aria-label="Minibus Tycoon - All Aboard!">
      <Image
        src="/brand/minibus-tycoon-mark.png"
        alt="Minibus Tycoon - All Aboard!"
        width={1456}
        height={816}
        priority
      />
    </div>
  );
}
