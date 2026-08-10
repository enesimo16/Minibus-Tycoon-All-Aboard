"use client";

import { useEffect } from "react";
import { useUiStore } from "./uiStore";

// Canvas/WebGL dışında tutuluyor — bkz. EditorHotkeys.tsx'teki aynı ders.
export function ManagementHotkeys() {
  const toggleManagement = useUiStore((s) => s.toggleManagement);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "u" || e.key === "U") toggleManagement();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleManagement]);

  return null;
}
